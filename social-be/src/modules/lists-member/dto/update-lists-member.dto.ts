import { PartialType } from '@nestjs/mapped-types';
import { CreateListsMemberDto } from './create-lists-member.dto';

export class UpdateListsMemberDto extends PartialType(CreateListsMemberDto) {}
