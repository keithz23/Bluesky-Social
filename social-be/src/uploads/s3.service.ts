import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('config.aws.region') ?? '';
    this.bucketName = this.configService.get<string>('config.aws.bucket') ?? '';
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('config.aws.accessKey') ?? '',
        secretAccessKey:
          this.configService.get('config.aws.secretAccessKey') ?? '',
      },
      ...(process.env.AWS_ENDPOINT
        ? {
            endpoint: process.env.AWS_ENDPOINT,
            forcePathStyle: true,
          }
        : {}),
    });
  }

  // Upload single image with optimization
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    options?: { resize?: boolean; quality?: number },
  ): Promise<UploadResult> {
    try {
      let buffer = file.buffer;
      let mimetype = file.mimetype;
      let ext = file.originalname.split('.').pop() || '';

      const isStaticImage = ['image/jpeg', 'image/png', 'image/webp'].includes(
        mimetype,
      );

      if (options?.resize && isStaticImage) {
        const sharpInstance = sharp(file.buffer).resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        });

        if (mimetype === 'image/png') {
          buffer = await sharpInstance
            .png({ quality: options.quality || 85 })
            .toBuffer();
        } else {
          buffer = await sharpInstance
            .jpeg({ quality: options.quality || 85 })
            .toBuffer();
          mimetype = 'image/jpeg';
          ext = 'jpg';
        }
      }

      const key = this.generateKey(folder, ext);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        ContentDisposition: 'inline',
        CacheControl: 'public, max-age=31536000, immutable',
        // ACL: 'public-read',
      });

      await this.s3Client.send(command);

      return {
        url: this.getFileUrl(key),
        key,
        size: buffer.length,
        mimetype,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw error;
    }
  }

  // Upload multiple images
  async uploadImages(
    files: Express.Multer.File[],
    folder: string,
    options?: { resize?: boolean; quality?: number },
  ): Promise<UploadResult[]> {
    // 1. Attempt all uploads
    const results = await Promise.allSettled(
      files.map((file) => this.uploadImage(file, folder, options)),
    );

    const successful: UploadResult[] = [];
    const failed: any[] = [];

    // 2. Separate success and failure
    for (const result of results) {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push(result.reason);
      }
    }

    // 3. If ANY failed, cleanup the successful ones and throw error
    if (failed.length > 0) {
      this.logger.error(
        `${failed.length} uploads failed. Cleaning up ${successful.length} successful uploads.`,
      );
      if (successful.length > 0) {
        await this.deleteFiles(successful.map((r) => r.key));
      }
      throw new Error(`Failed to upload some images: ${failed[0].message}`);
    }

    return successful;
  }

  // Generate thumbnail
  async generateThumbnail(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const buffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const key = this.generateKey(folder, 'jpg');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    return {
      url: this.getFileUrl(key),
      key,
      size: buffer.length,
      mimetype: 'image/jpeg',
    };
  }

  // Delete single file
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      this.logger.log(`Deleted file: ${key}`);
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`);
      throw error;
    }
  }

  // Delete multiple files
  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
        },
      });
      await this.s3Client.send(command);
      this.logger.log(`Deleted ${keys.length} files`);
    } catch (error) {
      this.logger.error(`Batch delete failed: ${error.message}`);
      throw error;
    }
  }

  // Generate unique key
  private generateKey(folder: string, ext: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomString}.${ext}`;
    return folder ? `${folder}/${filename}` : filename;
  }

  // Get file URL
  private getFileUrl(key: string): string {
    const cloudfrontDomain = this.configService.get<string>(
      'config.cloudfront.domain',
    );
    return `${cloudfrontDomain}/${key}`;
  }

  // Extract key from URL
  extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return url;
    }
  }
}
