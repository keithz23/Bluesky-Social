import { ApiProperty } from '@nestjs/swagger';

export class Enable2FAResponseDto {
  @ApiProperty()
  message!: string;

  @ApiProperty()
  recoveryCodes!: string[];
}
