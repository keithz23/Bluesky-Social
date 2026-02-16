import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly maxFiles: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    maxSize: number = 10 * 1024 * 1024, // 10MB
    maxFiles: number = 10,
    allowedMimeTypes: string[] = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
  ) {
    this.maxSize = maxSize;
    this.maxFiles = maxFiles;
    this.allowedMimeTypes = allowedMimeTypes;
  }

  transform(value: Express.Multer.File | Express.Multer.File[]) {
    if (!value) {
      return value; // Optional files
    }

    const files = Array.isArray(value) ? value : [value];

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
          `File "${file.originalname}" is too large. Maximum size is ${this.maxSize / 1024 / 1024}MB.`,
        );
      }

      // Check mime type
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File "${file.originalname}" has invalid type. Only images are allowed.`,
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

  private isValidImageBuffer(buffer: Buffer): boolean {
    const magicNumbers = {
      jpg: 'ffd8ff',
      png: '89504e47',
      gif: '47494638',
      webp: '52494646',
    };

    const bufferHex = buffer.toString('hex', 0, 4);

    return Object.values(magicNumbers).some((magic) =>
      bufferHex.startsWith(magic),
    );
  }
}
