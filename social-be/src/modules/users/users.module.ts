import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RateLimitModule } from 'src/rate-limit/rate-limit.module';
import { UploadModule } from 'src/uploads/upload.module';
import { UserProfileService } from './services/user-profile.service';
import { UserSearchService } from './services/user-search.service';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, RateLimitModule, UploadModule],
  controllers: [UsersController],
  providers: [UsersService, UserProfileService, UserSearchService],
})
export class UsersModule {}
