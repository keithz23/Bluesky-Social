import { IsIn, IsOptional } from 'class-validator';

export const DASHBOARD_RANGES = ['24h', '7d', '30d'] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export class DashboardQueryDto {
  @IsOptional()
  @IsIn(DASHBOARD_RANGES)
  range?: DashboardRange = '7d';
}
