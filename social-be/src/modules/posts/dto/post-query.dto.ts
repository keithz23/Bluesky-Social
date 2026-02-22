import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PostQueryDto {
  @IsOptional()
  cursor?: string; // post_id cuối của page trước

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsOptional()
  @IsIn(['posts', 'replies', 'media', 'videos', 'likes'])
  filter?: string = 'posts';
}
