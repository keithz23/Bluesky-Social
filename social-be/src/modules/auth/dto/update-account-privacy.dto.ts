import { IsBoolean } from 'class-validator';

export class UpdateAccountPrivacyDto {
  @IsBoolean()
  isPrivate!: boolean;
}
