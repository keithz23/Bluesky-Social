import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) { }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getFeed(
    @Query() query: FeedQueryDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.feedService.getFeed(currentUserId ?? null, query);
  }
}
