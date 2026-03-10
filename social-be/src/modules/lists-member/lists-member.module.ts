import { Module } from '@nestjs/common';
import { ListsMemberService } from './lists-member.service';
import { ListsMemberController } from './lists-member.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ListsMemberController],
  providers: [ListsMemberService],
})
export class ListsMemberModule {}
