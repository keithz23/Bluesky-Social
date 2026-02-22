import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId')
  follow(@CurrentUser('id') currentUserId, @Param('userId') userId: string) {
    return this.followsService.follow(currentUserId, userId);
  }

  @Delete(':userId')
  unfollow(@CurrentUser('id') currentUserId, @Param('userId') userId: string) {
    return this.followsService.unfollow(currentUserId, userId);
  }

  @Get('status/:userId')
  getStatus(@CurrentUser('id') currentUserId, @Param('userId') userId: string) {
    return this.followsService.getFollowStatus(currentUserId, userId);
  }

  @Post('requests/:senderId/accept')
  accept(
    @CurrentUser('id') currentUserId,
    @Param('senderId') senderId: string,
  ) {
    return this.followsService.acceptFollowRequest(currentUserId, senderId);
  }

  @Delete('requests/:senderId/decline')
  decline(
    @CurrentUser('id') currentUserId,
    @Param('senderId') senderId: string,
  ) {
    return this.followsService.declineFollowRequest(currentUserId, senderId);
  }
}
