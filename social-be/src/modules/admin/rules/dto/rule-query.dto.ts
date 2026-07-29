import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RuleSeverity } from '@prisma/client';

export class RuleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsEnum(RuleSeverity)
  severity?: RuleSeverity;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  all?: boolean;
}
