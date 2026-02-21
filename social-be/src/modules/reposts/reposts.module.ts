import { Module } from '@nestjs/common';
import { RepostsService } from './reposts.service';
import { RepostsController } from './reposts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RepostsController],
  providers: [RepostsService],
})
export class RepostsModule {}
