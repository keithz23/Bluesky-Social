import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
