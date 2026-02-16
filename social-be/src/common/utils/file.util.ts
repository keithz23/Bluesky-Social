import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export class FileUtil {
  static generateFileName(originalName: string): string {
    const ext = extname(originalName);
    const name = originalName.replace(ext, '');
    const timestamp = Date.now();
    const random = uuidv4();
    return `${name}-${timestamp}-${random}${ext}`;
  }

  static getFileExtension(filename: string): string {
    return extname(filename).toLowerCase();
  }

  static isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  static isVideo(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
