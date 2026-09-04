import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TwoFactorMethod } from '@prisma/client';
import { PublicUserResponseDto } from './public-user-response.dto';

/** Private account fields that are only returned to the authenticated owner. */
export class CurrentUserResponseDto extends PublicUserResponseDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  dateOfBirth!: string | null;

  @ApiProperty({ example: true })
  hasPassword!: boolean;

  @ApiProperty({ example: false })
  twoFactorEnabled!: boolean;

  @ApiPropertyOptional({ enum: TwoFactorMethod, nullable: true })
  twoFactorMethod!: TwoFactorMethod | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  twoFactorEnabledAt!: string | null;
}
