import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostMediaModerationStatus } from '@prisma/client';
import {
  DetectModerationLabelsCommand,
  ModerationLabel,
  RekognitionClient,
} from '@aws-sdk/client-rekognition';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';

export type ImageModerationLabel = {
  name: string;
  parentName: string | null;
  confidence: number;
};

export type ImageModerationResult = {
  status: PostMediaModerationStatus;
  provider: 'aws-rekognition' | 'disabled' | 'unsupported';
  labels: ImageModerationLabel[];
  checkedAt: Date | null;
  blockReason: string | null;
  shouldBlock: boolean;
  shouldReview: boolean;
  error?: string;
};

const DEFAULT_BLOCK_LABELS = [
  'Explicit Nudity',
  'Graphic Male Nudity',
  'Graphic Female Nudity',
  'Sexual Activity',
  'Graphic Violence',
  'Visually Disturbing',
];

const DEFAULT_REVIEW_LABELS = [
  'Explicit Nudity',
  'Nudity',
  'Sexual Situations',
  'Suggestive',
  'Violence',
  'Weapons',
  'Drugs',
  'Tobacco',
  'Alcohol',
  'Hate Symbols',
  'Visually Disturbing',
  'Rude Gestures',
];

@Injectable()
export class ImageModerationService {
  private readonly logger = new Logger(ImageModerationService.name);
  private readonly client: RekognitionClient;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('config.aws.accessKey');
    const secretAccessKey = this.configService.get<string>(
      'config.aws.secretAccessKey',
    );

    this.client = new RekognitionClient({
      region: this.configService.get<string>('config.aws.region'),
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
      ...(this.configService.get<string>('config.aws.rekognitionEndpoint')
        ? {
            endpoint: this.configService.get<string>(
              'config.aws.rekognitionEndpoint',
            ),
          }
        : {}),
    });
  }

  async scanUpload(upload: UploadResult): Promise<ImageModerationResult> {
    if (!this.isEnabled()) {
      return {
        status: PostMediaModerationStatus.SKIPPED,
        provider: 'disabled',
        labels: [],
        checkedAt: null,
        blockReason: null,
        shouldBlock: false,
        shouldReview: false,
      };
    }

    if (!this.canRekognitionScan(upload.mimetype)) {
      const shouldBlock =
        this.configService.get<boolean>(
          'config.imageModeration.blockUnscannable',
        ) ?? false;

      return {
        status: shouldBlock
          ? PostMediaModerationStatus.BLOCKED
          : PostMediaModerationStatus.SKIPPED,
        provider: 'unsupported',
        labels: [],
        checkedAt: new Date(),
        blockReason: shouldBlock
          ? 'Image type is not supported by moderation scan'
          : null,
        shouldBlock,
        shouldReview: false,
      };
    }

    try {
      const response = await this.client.send(
        new DetectModerationLabelsCommand({
          Image: {
            S3Object: {
              Bucket: this.configService.get<string>('config.aws.bucket'),
              Name: upload.key,
            },
          },
          MinConfidence: this.configService.get<number>(
            'config.imageModeration.minConfidence',
          ),
        }),
      );

      return this.evaluateLabels(response.ModerationLabels ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Image moderation failed';
      const shouldBlock =
        this.configService.get<boolean>('config.imageModeration.failClosed') ??
        false;

      this.logger.error('Rekognition image moderation failed', message);

      return {
        status: shouldBlock
          ? PostMediaModerationStatus.BLOCKED
          : PostMediaModerationStatus.ERROR,
        provider: 'aws-rekognition',
        labels: [],
        checkedAt: new Date(),
        blockReason: shouldBlock ? message : null,
        shouldBlock,
        shouldReview: false,
        error: message,
      };
    }
  }

  private evaluateLabels(
    moderationLabels: ModerationLabel[],
  ): ImageModerationResult {
    const labels = moderationLabels.map((label) => ({
      name: label.Name ?? '',
      parentName: label.ParentName || null,
      confidence: label.Confidence ?? 0,
    }));

    const blockLabels = this.getConfiguredLabels(
      'config.imageModeration.blockLabels',
      DEFAULT_BLOCK_LABELS,
    );
    const reviewLabels = this.getConfiguredLabels(
      'config.imageModeration.reviewLabels',
      DEFAULT_REVIEW_LABELS,
    );
    const blockConfidence =
      this.configService.get<number>(
        'config.imageModeration.blockConfidence',
      ) ?? 90;
    const reviewConfidence =
      this.configService.get<number>(
        'config.imageModeration.reviewConfidence',
      ) ?? 70;

    const blockingLabel = labels.find(
      (label) =>
        this.matchesLabel(blockLabels, label) &&
        label.confidence >= blockConfidence,
    );
    const reviewLabel = labels.find(
      (label) =>
        this.matchesLabel(reviewLabels, label) &&
        label.confidence >= reviewConfidence,
    );

    const shouldBlock = Boolean(blockingLabel);
    const shouldReview = shouldBlock || Boolean(reviewLabel);

    return {
      status: shouldBlock
        ? PostMediaModerationStatus.BLOCKED
        : shouldReview
          ? PostMediaModerationStatus.FLAGGED
          : PostMediaModerationStatus.APPROVED,
      provider: 'aws-rekognition',
      labels,
      checkedAt: new Date(),
      blockReason: blockingLabel
        ? `${blockingLabel.name} (${blockingLabel.confidence.toFixed(1)}%)`
        : null,
      shouldBlock,
      shouldReview,
    };
  }

  private isEnabled() {
    return this.configService.get<boolean>('config.imageModeration.enabled');
  }

  private canRekognitionScan(mimetype?: string) {
    return mimetype === 'image/jpeg' || mimetype === 'image/png';
  }

  private getConfiguredLabels(configKey: string, defaults: string[]) {
    const configured = this.configService.get<string>(configKey);
    if (!configured) return new Set(defaults);

    return new Set(
      configured
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
    );
  }

  private matchesLabel(
    labelSet: Set<string>,
    label: Pick<ImageModerationLabel, 'name' | 'parentName'>,
  ) {
    return (
      labelSet.has(label.name) ||
      (label.parentName ? labelSet.has(label.parentName) : false)
    );
  }
}
