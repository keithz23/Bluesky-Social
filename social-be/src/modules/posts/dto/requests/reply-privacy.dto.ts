import { IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class ReplyPrivacyDto {
  @IsEnum(['anyone', 'nobody', 'custom'])
  type!: 'anyone' | 'nobody' | 'custom';

  @IsBoolean()
  allowQuote!: boolean;

  @IsOptional()
  custom?: {
    followers: boolean;
    following: boolean;
    mentioned: boolean;
    lists?: string[];
  };
}
