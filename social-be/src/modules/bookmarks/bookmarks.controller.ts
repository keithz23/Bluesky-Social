import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}
  @Get()
  getBookmarks(@CurrentUser('id') userId: string) {
    return this.bookmarksService.getBookmarks(userId);
  }

  @Post(':postId')
  bookmark(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.bookmarksService.bookMark(userId, postId);
  }

  @Delete(':postId')
  unBookmark(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.bookmarksService.unBookmark(userId, postId);
  }
}
