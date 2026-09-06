import { IsBoolean } from 'class-validator';

export class UpdatePostVisibilityDto {
  @IsBoolean()
  isDeleted!: boolean;
}
