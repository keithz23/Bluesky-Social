import { Module } from '@nestjs/common';
import { KeywordsService } from './keywords.service';
import { KeywordsController } from './keywords.controller';

@Module({
  controllers: [KeywordsController],
  providers: [KeywordsService],
})
export class KeywordsModule {}
