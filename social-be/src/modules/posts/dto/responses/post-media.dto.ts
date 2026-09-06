import { Expose } from 'class-transformer';
import { MediaType } from '@prisma/client';

export class PostMediaDto {
  @Expose()
  id!: string;

  @Expose()
  mediaUrl!: string;

  @Expose()
  mediaType!: MediaType;

  @Expose()
  width!: number | null;

  @Expose()
  height!: number | null;

  @Expose()
  altText!: string | null;
}
