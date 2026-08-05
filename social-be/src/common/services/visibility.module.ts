import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VisibilityService } from './visibility.service';

@Module({
  imports: [PrismaModule],
  providers: [VisibilityService],
  exports: [VisibilityService],
})
export class VisibilityModule {}
