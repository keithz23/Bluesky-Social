import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FeedQueryDto } from '../feed/dto/feed-query.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';

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
    console.log(JSON.stringify(listFile));
    return this.listsService.createList(userId, createListDto, listFile);
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
