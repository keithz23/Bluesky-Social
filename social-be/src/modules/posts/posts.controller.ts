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
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ImageValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { IMAGE_UPLOAD } from 'src/common/constants/upload.constant';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PostQueryDto } from './dto/post-query.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { SearchPostsDto } from './dto/search-posts.dto';
import 'multer';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create-post')
  @UseInterceptors(FilesInterceptor('images', IMAGE_UPLOAD.MAX_POST_IMAGES))
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles(
      new ImageValidationPipe(
        IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES,
        IMAGE_UPLOAD.MAX_POST_IMAGES,
      ),
    )
    images: Express.Multer.File[],
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

  @Get('search')
  searchPosts(
    @CurrentUser('id') userId: string,
    @Query() query: SearchPostsDto,
  ) {
    return this.postsService.searchPosts(userId, query);
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
  @UseInterceptors(FilesInterceptor('images', IMAGE_UPLOAD.MAX_POST_IMAGES))
  createReply(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() createReplyDto: CreateReplyDto,
    @UploadedFiles(
      new ImageValidationPipe(
        IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES,
        IMAGE_UPLOAD.MAX_POST_IMAGES,
      ),
    )
    images?: Express.Multer.File[],
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
