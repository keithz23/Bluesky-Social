import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ListsMemberService } from './lists-member.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AddMembersDto } from './dto/add-member.dto';

@Controller('lists-member')
export class ListsMemberController {
  constructor(private readonly listsMemberService: ListsMemberService) {}

  @Post(':listId/members/:userIdToAdd')
  addMember(
    @Param('listId') listId: string,
    @Param('userIdToAdd') userIdToAdd: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.listsMemberService.addUserToList(
      listId,
      currentUserId,
      userIdToAdd,
    );
  }

  @Delete(':listId/members/:userIdToRemove')
  removeMember(
    @Param('listId') listId: string,
    @Param('userIdToRemove') userIdToRemove: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.listsMemberService.removeUserFromList(
      listId,
      currentUserId,
      userIdToRemove,
    );
  }

  @Get(':listId/members')
  getListMembers(
    @Param('listId') listId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.listsMemberService.getListMember(listId, currentUserId);
  }
}
