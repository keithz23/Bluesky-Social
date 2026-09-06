import { Injectable } from '@nestjs/common';
import {
  CreatePostDto,
  CreateReplyDto,
  PinPostQueryDto,
  PostQueryDto,
  SearchPostsDto,
  UpdatePostDto,
} from './dto/requests';
import { PostCommandService } from './services/post-command.service';
import { PostPinService } from './services/post-pin.service';
import { PostQueryService } from './services/post-query.service';
import { PostReplyService } from './services/post-reply.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly commands: PostCommandService,
    private readonly queries: PostQueryService,
    private readonly replies: PostReplyService,
    private readonly pins: PostPinService,
  ) {}

  create(
    userId: string,
    dto: CreatePostDto,
    images?: Express.Multer.File[],
  ): ReturnType<PostCommandService['create']> {
    return this.commands.create(userId, dto, images);
  }

  getPostByUsername(
    currentUserId: string,
    username: string,
    query: PostQueryDto,
  ): ReturnType<PostQueryService['getPostByUsername']> {
    return this.queries.getPostByUsername(currentUserId, username, query);
  }

  searchPosts(
    currentUserId: string,
    query: SearchPostsDto,
  ): ReturnType<PostQueryService['searchPosts']> {
    return this.queries.searchPosts(currentUserId, query);
  }

  getPostDetail(
    userId: string,
    postId: string,
  ): ReturnType<PostQueryService['getPostDetail']> {
    return this.queries.getPostDetail(userId, postId);
  }

  update(
    userId: string,
    postId: string,
    dto: UpdatePostDto,
    images?: Express.Multer.File[],
  ): ReturnType<PostCommandService['update']> {
    return this.commands.update(userId, postId, dto, images);
  }

  delete(
    userId: string,
    postId: string,
  ): ReturnType<PostCommandService['delete']> {
    return this.commands.delete(userId, postId);
  }

  createReply(
    userId: string,
    postId: string,
    dto: CreateReplyDto,
    images?: Express.Multer.File[],
  ): ReturnType<PostReplyService['createReply']> {
    return this.replies.createReply(userId, postId, dto, images);
  }

  getReplies(
    userId: string,
    postId: string,
    cursor?: string,
    limit: number = 20,
  ): ReturnType<PostReplyService['getReplies']> {
    return this.replies.getReplies(userId, postId, cursor, limit);
  }

  pinPost(
    userId: string,
    postId: string,
  ): ReturnType<PostPinService['pinPost']> {
    return this.pins.pinPost(userId, postId);
  }

  getPinPost(
    username: string,
    currentUserId: string,
    query: PinPostQueryDto,
  ): ReturnType<PostPinService['getPinPost']> {
    return this.pins.getPinPost(username, currentUserId, query);
  }

  unpinPost(
    userId: string,
    postId: string,
  ): ReturnType<PostPinService['unpinPost']> {
    return this.pins.unpinPost(userId, postId);
  }
}
