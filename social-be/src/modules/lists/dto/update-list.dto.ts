import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateListDto } from './create-list.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateListDto extends PartialType(CreateListDto) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  listId!: string;
}
