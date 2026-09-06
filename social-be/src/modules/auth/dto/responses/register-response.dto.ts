import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ example: 'clxxx...' })
  id!: string;

  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  displayName!: string;

  @ApiProperty({ example: false })
  verified!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}
