import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SyncPermissionsDto {
  @ApiProperty()
  @IsArray({ message: 'permissionIds must be an array' })
  @IsString({ each: true, message: 'Each permissionId must be a string' })
  permissionIds!: string[];
}
