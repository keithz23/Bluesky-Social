import { Module } from '@nestjs/common';
import { RekognitionService } from './rekognition.service';

@Module({
  providers: [RekognitionService],
  exports: [RekognitionService], // Export it so Posts or Users modules can use it
})
export class RekognitionModule {}
