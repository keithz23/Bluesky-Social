import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RepliesService } from './replies.service';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';

@Controller('replies')
export class RepliesController {
  constructor(private readonly repliesService: RepliesService) {}

  
}
