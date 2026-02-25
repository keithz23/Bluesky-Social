import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RepliesService {
  constructor(private readonly prisma: PrismaService) {}
}
