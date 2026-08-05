import { Logger } from '@nestjs/common';
import { PostMediaModerationStatus } from '@prisma/client';
import { ImageModerationService } from './image-moderation.service';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';

const upload: UploadResult = {
  url: 'https://cdn.example.com/posts/image.png',
  key: 'posts/image.png',
  mimetype: 'image/png',
  size: 1234,
  width: 800,
  height: 600,
};

const makeConfigService = (overrides: Record<string, unknown> = {}) => {
  const values: Record<string, unknown> = {
    'config.aws.region': 'us-east-1',
    'config.aws.bucket': 'social-media',
    'config.imageModeration.enabled': true,
    'config.imageModeration.failClosed': false,
    'config.imageModeration.blockUnscannable': false,
    'config.imageModeration.minConfidence': 60,
    'config.imageModeration.reviewConfidence': 70,
    'config.imageModeration.blockConfidence': 90,
    ...overrides,
  };

  return {
    get: jest.fn((key: string) => values[key]),
  };
};

const mockRekognition = (
  service: ImageModerationService,
  responseOrError: unknown,
) => {
  const send = jest.fn();

  if (responseOrError instanceof Error) {
    send.mockRejectedValue(responseOrError);
  } else {
    send.mockResolvedValue(responseOrError);
  }

  Object.defineProperty(service, 'client', {
    value: { send },
  });

  return send;
};

describe('ImageModerationService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips scans when image moderation is disabled', async () => {
    const service = new ImageModerationService(
      makeConfigService({
        'config.imageModeration.enabled': false,
      }) as any,
    );

    await expect(service.scanUpload(upload)).resolves.toMatchObject({
      status: PostMediaModerationStatus.SKIPPED,
      provider: 'disabled',
      shouldBlock: false,
      shouldReview: false,
    });
  });

  it('blocks unsupported image types when configured to fail closed', async () => {
    const service = new ImageModerationService(
      makeConfigService({
        'config.imageModeration.blockUnscannable': true,
      }) as any,
    );

    await expect(
      service.scanUpload({ ...upload, mimetype: 'image/gif' }),
    ).resolves.toMatchObject({
      status: PostMediaModerationStatus.BLOCKED,
      provider: 'unsupported',
      shouldBlock: true,
      shouldReview: false,
    });
  });

  it('blocks images with high-confidence block labels', async () => {
    const service = new ImageModerationService(makeConfigService() as any);
    const send = mockRekognition(service, {
      ModerationLabels: [
        {
          Name: 'Explicit Nudity',
          ParentName: '',
          Confidence: 96,
        },
      ],
    });

    await expect(service.scanUpload(upload)).resolves.toMatchObject({
      status: PostMediaModerationStatus.BLOCKED,
      provider: 'aws-rekognition',
      shouldBlock: true,
      shouldReview: true,
      blockReason: 'Explicit Nudity (96.0%)',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('flags images with review labels below the block threshold', async () => {
    const service = new ImageModerationService(makeConfigService() as any);
    mockRekognition(service, {
      ModerationLabels: [
        {
          Name: 'Violence',
          ParentName: '',
          Confidence: 75,
        },
      ],
    });

    await expect(service.scanUpload(upload)).resolves.toMatchObject({
      status: PostMediaModerationStatus.FLAGGED,
      shouldBlock: false,
      shouldReview: true,
      blockReason: null,
    });
  });

  it('returns an error result when Rekognition fails and fail closed is off', async () => {
    const service = new ImageModerationService(makeConfigService() as any);
    mockRekognition(service, new Error('AWS region is missing'));

    await expect(service.scanUpload(upload)).resolves.toMatchObject({
      status: PostMediaModerationStatus.ERROR,
      shouldBlock: false,
      shouldReview: false,
      error: 'AWS region is missing',
    });
  });
});
