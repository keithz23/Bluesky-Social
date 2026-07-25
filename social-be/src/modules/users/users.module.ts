import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
<<<<<<< HEAD
import { RateLimitModule } from 'src/rate-limit/rate-limit.module';
=======
>>>>>>> origin/feat/add-staging

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
