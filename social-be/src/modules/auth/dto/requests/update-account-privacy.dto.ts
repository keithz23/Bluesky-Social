import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAccountPrivacyDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPrivate!: boolean;
}
