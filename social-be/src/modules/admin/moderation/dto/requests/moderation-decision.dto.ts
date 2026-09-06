import { IsEnum } from 'class-validator';

export enum ModerationDecision {
  HIDE = 'HIDE',
  RESTORE = 'RESTORE',
  RESOLVE = 'RESOLVE',
  DISMISS = 'DISMISS',
}

export class ModerationDecisionDto {
  @IsEnum(ModerationDecision)
  action: ModerationDecision;
}
