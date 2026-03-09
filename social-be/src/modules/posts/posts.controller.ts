import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ImageValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PostQueryDto } from './dto/post-query.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create-post')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles(new ImageValidationPipe()) images: Express.Multer.File[],
    @CurrentUser('id') userId: string,
  ) {
    const post = await this.postsService.create(userId, createPostDto, images);
    return {
      message: 'Post created successfully',
      post,
    };
  }

  @Get('/users/:username')
  getPostByUsername(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
    @Query() query: PostQueryDto,
  ) {
    return this.postsService.getPostByUsername(userId, username, query);
  }

  @Get('post-detail/:postId')
  getPostDetail(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.postsService.getPostDetail(userId, postId);
  }

  @Delete('/delete-post/:postId')
  delete(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.postsService.delete(userId, postId);
  }

  @Post(':postId/replies')
  @UseInterceptors(FilesInterceptor('images', 4))
  createReply(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() createReplyDto: CreateReplyDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.postsService.createReply(
      userId,
      postId,
      createReplyDto,
      images,
    );
  }

  @Get(':postId/replies')
  getReplies(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.postsService.getReplies(userId, postId, cursor, limit);
  }
}
