import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SearchUserDto {
  @IsString()
  @MaxLength(50)
  q: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
