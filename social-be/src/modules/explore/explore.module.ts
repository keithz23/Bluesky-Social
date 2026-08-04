import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { VisibilityModule } from 'src/common/services/visibility.module';

@Module({
  imports: [PrismaModule, VisibilityModule],
  controllers: [ExploreController],
  providers: [ExploreService],
})
export class ExploreModule {}
