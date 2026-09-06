import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class DeleteRuleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ruleIds: string[];
}
