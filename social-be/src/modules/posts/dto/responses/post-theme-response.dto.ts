import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PostThemeResponseDto {
  @Expose()
  @ApiProperty({ example: 'preset' })
  type!: string;

  @Expose()
  @ApiProperty({ example: 'linear-gradient(135deg, #1877f2, #9b5cff)' })
  background!: string;
}
