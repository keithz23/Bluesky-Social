import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ListsMemberService } from './lists-member.service';
import { CreateListsMemberDto } from './dto/create-lists-member.dto';
import { UpdateListsMemberDto } from './dto/update-lists-member.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AddMembersDto } from './dto/add-member.dto';

@Controller('lists-member')
export class ListsMemberController {
  constructor(private readonly listsMemberService: ListsMemberService) {}

  @Post(':listId/members')
  async addMembers(
    @Param('listId') listId: string,
    @CurrentUser('id') userId: string,
    @Body() addMembersDto: AddMembersDto,
  ) {
    return this.listsMemberService.addUsersToList(
      listId,
      userId,
      addMembersDto.participantIds,
    );
  }
}
