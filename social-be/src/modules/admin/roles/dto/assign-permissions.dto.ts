import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class assignPermissionsDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  permissionIds!: string[];
}
