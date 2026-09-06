import { PartialType } from '@nestjs/mapped-types';
import { CreateRepostDto } from './create-repost.dto';

export class UpdateRepostDto extends PartialType(CreateRepostDto) {}
