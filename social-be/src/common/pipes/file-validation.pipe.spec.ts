import { BadRequestException } from '@nestjs/common';
import { IMAGE_UPLOAD } from '../constants/upload.constant';
import { ImageValidationPipe } from './file-validation.pipe';

const makeFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    fieldname: 'images',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 4,
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
    ...overrides,
  }) as Express.Multer.File;

describe('ImageValidationPipe', () => {
  it('accepts valid image uploads', () => {
    const pipe = new ImageValidationPipe();
    const files = [
      makeFile(),
      makeFile({
        originalname: 'test.png',
        mimetype: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      }),
    ];

    expect(pipe.transform(files)).toBe(files);
  });

  it('accepts file field maps from profile upload', () => {
    const pipe = new ImageValidationPipe(
      IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES,
      IMAGE_UPLOAD.MAX_PROFILE_IMAGES,
    );
    const files = {
      avatar: [makeFile()],
      cover: [makeFile({ originalname: 'cover.jpg' })],
    };

    expect(pipe.transform(files)).toBe(files);
  });

  it('rejects uploads over the configured file limit', () => {
    const pipe = new ImageValidationPipe(
      IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES,
      1,
    );

    expect(() => pipe.transform([makeFile(), makeFile()])).toThrow(
      BadRequestException,
    );
  });

  it('rejects oversized files', () => {
    const pipe = new ImageValidationPipe();

    expect(() =>
      pipe.transform(
        makeFile({ size: IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES + 1 }),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects unsupported mime types', () => {
    const pipe = new ImageValidationPipe();

    expect(() =>
      pipe.transform(
        makeFile({
          originalname: 'test.gif',
          mimetype: 'image/gif',
          buffer: Buffer.from([0x47, 0x49, 0x46, 0x38]),
        }),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects files with invalid image signatures', () => {
    const pipe = new ImageValidationPipe();

    expect(() =>
      pipe.transform(
        makeFile({
          buffer: Buffer.from([0x00, 0x11, 0x22, 0x33]),
        }),
      ),
    ).toThrow(BadRequestException);
  });
});
