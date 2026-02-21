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
import { FeedService } from './feed.service';
import { CreateFeedDto } from './dto/create-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(
    @Query() query: FeedQueryDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.feedService.getFeed(currentUserId, query);
  }

  @Post()
  create(@Body() createFeedDto: CreateFeedDto) {
    return this.feedService.create(createFeedDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeedDto: UpdateFeedDto) {
    return this.feedService.update(+id, updateFeedDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedService.remove(+id);
  }
}
