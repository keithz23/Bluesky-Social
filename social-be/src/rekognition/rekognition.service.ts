import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
  DetectLabelsCommand,
} from '@aws-sdk/client-rekognition';

@Injectable()
export class RekognitionService {
  private rekognitionClient: RekognitionClient;

  constructor() {
    const config: any = { region: process.env.AWS_REGION };

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }

    this.rekognitionClient = new RekognitionClient(config);
  }

  /**
   * Content Moderation: Detects explicit, suggestive, or violent content
   */
  async moderateImage(imageBuffer: Buffer): Promise<boolean> {
    try {
      const command = new DetectModerationLabelsCommand({
        Image: { Bytes: imageBuffer },
        MinConfidence: 70, // Set threshold to catch borderline content
      });

      const response = await this.rekognitionClient.send(command);

      // If any unsafe labels are returned, flag the image as inappropriate
      const hasUnsafeContent =
        response.ModerationLabels && response.ModerationLabels.length > 0;
      return !hasUnsafeContent; // Returns true if safe, false if unsafe
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to process image moderation',
      );
    }
  }

  /**
   * Smart Tagging: Detects objects/scenes for automated post hashtags
   */
  async autoTagImage(imageBuffer: Buffer): Promise<string[]> {
    try {
      const command = new DetectLabelsCommand({
        Image: { Bytes: imageBuffer },
        MaxLabels: 5,
        MinConfidence: 80,
      });

      const response = await this.rekognitionClient.send(command);
      return (
        response.Labels?.flatMap((label) =>
          label.Name ? [label.Name.toLowerCase()] : [],
        ) || []
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to auto-tag image');
    }
  }
}
