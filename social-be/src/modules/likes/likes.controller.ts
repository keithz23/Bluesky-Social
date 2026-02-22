import { Controller, Post, Param, Delete } from '@nestjs/common';
import { LikesService } from './likes.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':postId')
  like(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.likesService.like(userId, postId);
  }

  @Delete(':postId')
  unLike(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.likesService.unLike(userId, postId);
  }
}
