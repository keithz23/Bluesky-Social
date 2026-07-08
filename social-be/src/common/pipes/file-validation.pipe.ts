import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { IMAGE_UPLOAD, formatUploadSize } from '../constants/upload.constant';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly maxFiles: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    maxSize: number = IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES,
    maxFiles: number = IMAGE_UPLOAD.MAX_POST_IMAGES,
    allowedMimeTypes: readonly string[] = IMAGE_UPLOAD.ALLOWED_MIME_TYPES,
  ) {
    this.maxSize = maxSize;
    this.maxFiles = maxFiles;
    this.allowedMimeTypes = [...allowedMimeTypes];
  }

  transform(
    value:
      | Express.Multer.File
      | Express.Multer.File[]
      | Record<string, Express.Multer.File[]>
      | undefined,
  ) {
    if (!value) {
      return value; // Optional files
    }

    const files = this.toFiles(value);

    if (files.length > this.maxFiles) {
      throw new BadRequestException(
        `Too many files. Maximum ${this.maxFiles} images allowed.`,
      );
    }

    // Validate file
    for (const file of files) {
      // Check size
      if (file.size > this.maxSize) {
        throw new BadRequestException(
          `File "${file.originalname}" is too large. Maximum size is ${formatUploadSize(this.maxSize)}.`,
        );
      }

      // Check mime type
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File "${file.originalname}" has invalid type. Only JPG, PNG, and WEBP images are allowed.`,
        );
      }

      // check magic number
      if (!this.isValidImageBuffer(file.buffer)) {
        throw new BadRequestException(
          `File "${file.originalname}" is not a valid image.`,
        );
      }
    }

    return value;
  }

  private toFiles(
    value:
      | Express.Multer.File
      | Express.Multer.File[]
      | Record<string, Express.Multer.File[]>,
  ): Express.Multer.File[] {
    if (Array.isArray(value)) return value;
    if (this.isMulterFile(value)) return [value];

    return Object.values(value).flat();
  }

  private isMulterFile(value: unknown): value is Express.Multer.File {
    return (
      typeof value === 'object' &&
      value !== null &&
      'buffer' in value &&
      Buffer.isBuffer((value as { buffer?: unknown }).buffer)
    );
  }

  private isValidImageBuffer(buffer: Buffer): boolean {
    const magicNumbers = {
      jpg: 'ffd8ff',
      png: '89504e47',
      webp: '52494646',
    };

    const bufferHex = buffer.toString('hex', 0, 4);

    return Object.values(magicNumbers).some((magic) =>
      bufferHex.startsWith(magic),
    );
  }
}
