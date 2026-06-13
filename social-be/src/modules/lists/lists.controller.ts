import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FeedQueryDto } from '../feed/dto/feed-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateListDto } from './dto/update-list.dto';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post('create-list')
  @UseInterceptors(FileInterceptor('listFile'))
  createList(
    @CurrentUser('id') userId: string,
    @Body() createListDto: CreateListDto,
    @UploadedFile()
    listFile: Express.Multer.File,
  ) {
    return this.listsService.createList(userId, createListDto, listFile);
  }

  @Patch('update-list')
  @UseInterceptors(FileInterceptor('listFile'))
  updateList(
    @CurrentUser('id') userId: string,
    @Body() updateListDto: UpdateListDto,
    @UploadedFile() listFile: Express.Multer.File,
  ) {
    return this.listsService.updateList(userId, updateListDto, listFile);
  }

  @Delete('delete-list/:listId')
  deleteList(
    @CurrentUser('id') userId: string,
    @Param('listId') listId: string,
  ) {
    return this.listsService.deleteList(userId, listId);
  }

  @Get('get-lists')
  getLists(@CurrentUser('id') userId: string, @Query() query: FeedQueryDto) {
    return this.listsService.getLists(userId, query);
  }

  @Get('get-list-by-id/:listId')
  getListById(
    @CurrentUser('id') userId: string,
    @Param('listId') listId: string,
  ) {
    return this.listsService.getListById(userId, listId);
  }
}
