import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FeedQueryDto } from '../feed/dto/feed-query.dto';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post('create-list')
  createList(
    @CurrentUser('id') userId: string,
    @Body() createListDto: CreateListDto,
  ) {
    return this.listsService.createList(userId, createListDto);
  }

  @Get('get-lists')
  getLists(@CurrentUser('id') userId: string, @Body() query: FeedQueryDto) {
    return this.listsService.getLists(userId, query.cursor, query.limit);
  }
}
