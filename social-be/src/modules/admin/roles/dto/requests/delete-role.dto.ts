import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class DeleteRoleDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  roleIds!: string[];
}
