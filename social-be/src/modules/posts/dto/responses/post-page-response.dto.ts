import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PostResponseDto } from './post-response.dto';

export class PostsPageResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  @Type(() => PostResponseDto)
  posts!: PostResponseDto[];

  @ApiProperty({ nullable: true })
  nextCursor!: string | null;

  @ApiProperty()
  hasMore!: boolean;
}

export class RepliesPageResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  @Type(() => PostResponseDto)
  replies!: PostResponseDto[];

  @ApiProperty({ nullable: true })
  nextCursor!: string | null;

  @ApiProperty()
  hasMore!: boolean;
}

export class CreatePostResponseDto {
  @ApiProperty()
  message!: string;

  @ApiProperty({ type: PostResponseDto, nullable: true })
  @Type(() => PostResponseDto)
  post!: PostResponseDto | null;
}

export class PostActionResponseDto {
  @ApiProperty()
  message!: string;
}
