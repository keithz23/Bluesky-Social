import { ReportStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
