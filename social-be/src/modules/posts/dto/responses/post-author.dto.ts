import { Expose } from 'class-transformer';

export class PostAuthorDto {
  @Expose()
  id!: string;

  @Expose()
  username!: string;

  @Expose()
  displayName!: string;

  @Expose()
  avatarUrl!: string | null;
}
