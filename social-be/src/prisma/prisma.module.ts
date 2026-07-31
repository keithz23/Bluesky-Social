import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CommonModule } from 'src/common/common.module';

@Global()
@Module({
  imports: [CommonModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
