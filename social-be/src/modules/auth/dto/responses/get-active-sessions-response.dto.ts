import { ApiProperty } from '@nestjs/swagger';

export class GetActiveSessionsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  userAgent!: string | null;

  @ApiProperty()
  ipAddress!: string | null;

  @ApiProperty()
  expiresAt!: Date;
}
