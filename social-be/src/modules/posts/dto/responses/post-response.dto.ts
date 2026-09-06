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
  createdAt!: Date | string;

  @Expose()
  likeCount!: number;

  @Expose()
  replyCount!: number;

  @Expose()
  repostCount!: number;

  @Expose()
  bookmarkCount!: number;

  @Expose()
  postTheme?: unknown;

  @Expose()
  @Type(() => PostAuthorDto)
  user!: PostAuthorDto;

  @Expose()
  @Type(() => PostMediaDto)
  media!: PostMediaDto[];

  @Expose()
  isLiked!: boolean;

  @Expose()
  isBookmarked!: boolean;

  @Expose()
  isReposted!: boolean;

  @Expose()
  isPinned?: boolean;

  @Expose()
  autoFlagged?: boolean;

  @Expose()
  isDeleted?: boolean;
}
