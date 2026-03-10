import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateListsMemberDto } from './dto/create-lists-member.dto';
import { UpdateListsMemberDto } from './dto/update-lists-member.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListsMemberService {
  constructor(private readonly prisma: PrismaService) {}

  async addUsersToList(
    listId: string,
    currentUserId: string,
    participantIds?: string[],
  ) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId, userId: currentUserId },
    });

    if (!list) {
      throw new ForbiddenException('List not found or you are not a owner');
    }

    if (!participantIds || participantIds.length === 0) {
      return { message: 'No users provided to add', addedCount: 0 };
    }

    const result = await this.prisma.listMember.createMany({
      data: participantIds.map((memberId) => ({
        listId,
        memberId,
        addedBy: currentUserId,
      })),
      skipDuplicates: true,
    });

    return {
      message: `Successfully added ${result.count} new users to the list`,
      addedCount: result.count,
    };
  }
}
