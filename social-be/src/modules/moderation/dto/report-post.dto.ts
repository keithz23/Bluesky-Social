import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class ReportPostDto {
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @IsOptional()
  @IsString()
  details?: string;
}
