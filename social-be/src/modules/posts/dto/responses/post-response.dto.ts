import { Expose, Type } from 'class-transformer';
import { PostAuthorDto } from './post-author.dto';
import { PostMediaDto } from './post-media.dto';
import { PostThemeResponseDto } from './post-theme-response.dto';

export class PostResponseDto {
  @Expose()
  id!: string;

  @Expose()
  content!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  likeCount!: number;

  @Expose()
  replyCount!: number;

  @Expose()
  repostCount!: number;

  @Expose()
  bookmarkCount!: number;

  @Expose()
  @Type(() => PostThemeResponseDto)
  postTheme!: PostThemeResponseDto | null;

  @Expose()
  @Type(() => PostAuthorDto)
  user!: PostAuthorDto;

  @Expose()
  @Type(() => PostMediaDto)
  media!: PostMediaDto[];

  @Expose()
  autoFlagged!: boolean;

  @Expose()
  isDeleted!: boolean;
}
