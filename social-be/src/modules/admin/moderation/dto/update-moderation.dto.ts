import { PartialType } from '@nestjs/mapped-types';
import { CreateModerationDto } from './create-moderation.dto';

export class UpdateModerationDto extends PartialType(CreateModerationDto) {}
