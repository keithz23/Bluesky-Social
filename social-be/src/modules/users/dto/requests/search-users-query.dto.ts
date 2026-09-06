import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  USER_LIST_ID_MAX_LENGTH,
  USER_SEARCH_LIMIT_DEFAULT,
  USER_SEARCH_LIMIT_MAX,
  USER_SEARCH_LIMIT_MIN,
  USER_SEARCH_QUERY_MAX_LENGTH,
} from '../shared';

export class SearchUsersQueryDto {
  @IsString()
  @MaxLength(USER_SEARCH_QUERY_MAX_LENGTH)
  q!: string;

  @IsOptional()
  @IsInt()
  @Min(USER_SEARCH_LIMIT_MIN)
  @Max(USER_SEARCH_LIMIT_MAX)
  limit?: number = USER_SEARCH_LIMIT_DEFAULT;

  @IsOptional()
  @IsString()
  @MaxLength(USER_LIST_ID_MAX_LENGTH)
  listId?: string;
}
