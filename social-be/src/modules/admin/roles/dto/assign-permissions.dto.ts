import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class assignPermissionsDto {
  @ApiProperty()
  @IsNotEmpty()
  permissionIds!: string[];
}
