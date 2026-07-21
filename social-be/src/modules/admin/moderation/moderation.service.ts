import { Injectable } from '@nestjs/common';
import { CreateModerationDto } from './dto/create-moderation.dto';
import { UpdateModerationDto } from './dto/update-moderation.dto';

@Injectable()
export class ModerationService {
  create(createModerationDto: CreateModerationDto) {
    return 'This action adds a new moderation';
  }

  findAll() {
    return `This action returns all moderation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} moderation`;
  }

  update(id: number, updateModerationDto: UpdateModerationDto) {
    return `This action updates a #${id} moderation`;
  }

  remove(id: number) {
    return `This action removes a #${id} moderation`;
  }
}
