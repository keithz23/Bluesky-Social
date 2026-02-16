import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token obtained from login/signup' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
