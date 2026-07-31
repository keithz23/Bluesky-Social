import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ImageValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { IMAGE_UPLOAD } from 'src/common/constants/upload.constant';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PostQueryDto } from './dto/post-query.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { SearchPostsDto } from './dto/search-posts.dto';
import { PinPostQueryDto } from './dto/pin-post-query.dto';
import { ReplyQueryDto } from './dto/reply-query.dto';
import 'multer';
import { RateLimitGuard } from 'src/rate-limit/rate-limit.guard';
import { RateLimit } from 'src/rate-limit/token.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create-post')
  @RateLimit({ capacity: 100, refillRate: 10 / 60 })
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
  @RateLimit({ capacity: 300, refillRate: 100 / 60 })
  getPostByUsername(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
    @Query() query: PostQueryDto,
  ) {
    return this.postsService.getPostByUsername(userId, username, query);
  }

  @Get('search')
  @RateLimit({ capacity: 500, refillRate: 100 / 60 })
  searchPosts(
    @CurrentUser('id') userId: string,
    @Query() query: SearchPostsDto,
  ) {
    return this.postsService.searchPosts(userId, query);
  }

  @Get('post-detail/:postId')
  @RateLimit({ capacity: 300, refillRate: 100 / 60 })
  getPostDetail(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.postsService.getPostDetail(userId, postId);
  }

  @Patch('/update-post/:postId')
  @RateLimit({ capacity: 300, refillRate: 100 / 60 })
  @UseInterceptors(FilesInterceptor('images', IMAGE_UPLOAD.MAX_POST_IMAGES))
  update(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFiles(
      new ImageValidationPipe(
        IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES,
        IMAGE_UPLOAD.MAX_POST_IMAGES,
      ),
    )
    images?: Express.Multer.File[],
  ) {
    return this.postsService.update(userId, postId, updatePostDto, images);
  }

  @Delete('/delete-post/:postId')
  @RateLimit({ capacity: 100, refillRate: 100 / 60 })
  delete(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.postsService.delete(userId, postId);
  }

  @Post(':postId/replies')
  @RateLimit({ capacity: 500, refillRate: 100 / 60 })
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
  @RateLimit({ capacity: 500, refillRate: 100 / 60 })
  getReplies(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Query() query: ReplyQueryDto,
  ) {
    return this.postsService.getReplies(userId, postId, query.cursor, query.limit);
  }

  @Get('/users/pin-post/:username')
  @RateLimit({ capacity: 300, refillRate: 100 / 60 })
  async getPinPost(
    @Param('username') username: string,
    @CurrentUser('id') userId: string,
    @Query() query: PinPostQueryDto,
  ) {
    return this.postsService.getPinPost(username, userId, query);
  }
  @Post(':postId/pin')
  async pinPost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.postsService.pinPost(userId, postId);
  }

  @Delete(':postId/unpin')
  @RateLimit({ capacity: 100, refillRate: 100 / 60 })
  async unpinPost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.postsService.unpinPost(userId, postId);
  }
}
