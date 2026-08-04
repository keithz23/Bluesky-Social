import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @Get()
  async getFeed(
    @Query() query: FeedQueryDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.feedService.getFeed(currentUserId ?? null, query);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('catalog')
  getCatalog(@CurrentUser('id') currentUserId?: string) {
    return this.feedService.getCatalog(currentUserId ?? null);
  }

  @Get('pinned')
  getPinned(@CurrentUser('id') currentUserId: string) {
    return this.feedService.getPinnedFeeds(currentUserId);
  }

  @Post(':slug/pin')
  pin(@Param('slug') slug: string, @CurrentUser('id') currentUserId: string) {
    return this.feedService.pinFeed(currentUserId, slug);
  }

  @Delete(':slug/pin')
  unpin(@Param('slug') slug: string, @CurrentUser('id') currentUserId: string) {
    return this.feedService.unpinFeed(currentUserId, slug);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug/posts')
  getFeedPosts(
    @Param('slug') slug: string,
    @Query() query: FeedQueryDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.feedService.getSystemFeed(
      slug,
      currentUserId ?? null,
      query,
    );
  }
}
