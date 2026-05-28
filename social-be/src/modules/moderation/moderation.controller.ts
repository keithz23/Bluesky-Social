import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ReportPostDto } from './dto/report-post.dto';
import { ModerationService } from './moderation.service';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('blocks/:userId')
  blockUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.moderationService.blockUser(currentUserId, targetUserId);
  }

  @Delete('blocks/:userId')
  unblockUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.moderationService.unblockUser(currentUserId, targetUserId);
  }

  @Post('mutes/:userId')
  muteUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.moderationService.muteUser(currentUserId, targetUserId);
  }

  @Delete('mutes/:userId')
  unmuteUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.moderationService.unmuteUser(currentUserId, targetUserId);
  }

  @Post('reports/posts/:postId')
  reportPost(
    @CurrentUser('id') currentUserId: string,
    @Param('postId') postId: string,
    @Body() dto: ReportPostDto,
  ) {
    return this.moderationService.reportPost(currentUserId, postId, dto);
  }
}
