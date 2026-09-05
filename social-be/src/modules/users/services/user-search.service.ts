import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchUsersQueryDto } from '../dto/requests';
import { UserSearchItemResponseDto } from '../dto/responses';
import { USER_SEARCH_LIMIT_DEFAULT } from '../dto/shared';
import {
  toUserSearchItemResponse,
  UserSearchRow,
} from '../mappers/user-response.mapper';

@Injectable()
export class UserSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    userId: string,
    query: SearchUsersQueryDto,
  ): Promise<UserSearchItemResponseDto[]> {
    const { q, limit = USER_SEARCH_LIMIT_DEFAULT, listId } = query;
    const isAddedSelect = listId
      ? Prisma.sql`, EXISTS(SELECT 1 FROM list_members lm WHERE lm.member_id = users.id AND lm.list_id = ${listId}) AS "isAdded"`
      : Prisma.sql`, false AS "isAdded"`;

    const users = await this.prisma.$queryRaw<UserSearchRow[]>`
      SELECT
        id,
        username,
        bio,
        verified,
        avatar_url AS "avatarUrl",
        cover_url AS "coverUrl",
        display_name AS "displayName"
        ${isAddedSelect}
      FROM users
      WHERE (
        username ILIKE ${`%${q}%`}
        OR display_name ILIKE ${`%${q}%`}
      )
      AND id != ${userId}
      ORDER BY
        CASE
          WHEN username ILIKE ${`${q}%`} THEN 0
          WHEN display_name ILIKE ${`${q}%`} THEN 1
          ELSE 2
        END
      LIMIT ${Prisma.sql`${limit}::int`}
    `;

    return users.map(toUserSearchItemResponse);
  }
}
