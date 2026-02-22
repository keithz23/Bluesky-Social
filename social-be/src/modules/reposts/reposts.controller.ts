import { Controller, Post, Param, Delete } from '@nestjs/common';
import { RepostsService } from './reposts.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('reposts')
export class RepostsController {
  constructor(private readonly repostsService: RepostsService) {}

  @Post(':postId')
  repost(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.repostsService.repost(userId, postId);
  }

  @Delete(':postId')
  unRepost(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.repostsService.unRepost(userId, postId);
  }
}
