import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: 'clxxx...' })
  id!: string;

  @ApiProperty({ example: 'user' })
  name!: string;

  @ApiProperty({ example: 1 })
  level!: number;

  @ApiProperty({
    type: [String],
    example: ['post:create', 'post:read'],
  })
  permissions!: string[];
}
