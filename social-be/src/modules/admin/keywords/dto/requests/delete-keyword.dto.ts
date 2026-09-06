import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class DeleteKeywordDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keywordIds!: string[];
}
