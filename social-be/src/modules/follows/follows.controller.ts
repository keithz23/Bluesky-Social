import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FollowQueryDto } from './dto/follow-query.dto';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get('following-lists')
  getFollowingLists(@Query() query: FollowQueryDto) {
    return this.followsService.getFollowingLists(query);
  }

  @Get('follower-lists')
  getFollowerLists(@Query() query: FollowQueryDto) {
    return this.followsService.getFollowerLists(query);
  }

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
