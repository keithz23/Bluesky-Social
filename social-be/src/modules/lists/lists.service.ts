import { Injectable } from '@nestjs/common';
import { FeedQueryDto } from 'src/modules/feed/dto/requests/feed-query.dto';
import { CreateListDto } from './dto/requests/create-list.dto';
import { UpdateListDto } from './dto/requests/update-list.dto';
import { ListsCommandService } from './services/lists-command.service';
import { ListsQueryService } from './services/lists-query.service';

@Injectable()
export class ListsService {
  constructor(
    private readonly commands: ListsCommandService,
    private readonly queries: ListsQueryService,
  ) {}

  createList(
    userId: string,
    createListDto: CreateListDto,
    listFile: Express.Multer.File,
  ) {
    return this.commands.createList(userId, createListDto, listFile);
  }

  updateList(
    userId: string,
    updateListDto: UpdateListDto,
    listFile?: Express.Multer.File,
  ) {
    return this.commands.updateList(userId, updateListDto, listFile);
  }

  deleteList(userId: string, listId: string) {
    return this.commands.deleteList(userId, listId);
  }

  addPostToList(userId: string, listId: string, postId: string) {
    return this.commands.addPostToList(userId, listId, postId);
  }

  removePostFromList(userId: string, listId: string, postId: string) {
    return this.commands.removePostFromList(userId, listId, postId);
  }

  getLists(userId: string, query: FeedQueryDto) {
    return this.queries.getLists(userId, query);
  }

  getListById(userId: string, listId: string) {
    return this.queries.getListById(userId, listId);
  }
}
