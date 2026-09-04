import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetResponseDto {
  @ApiProperty()
  message!: string;

  @ApiProperty()
  canResetPassword!: boolean;
}
