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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { ImageValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { IMAGE_UPLOAD } from 'src/common/constants/upload.constant';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiEnvelopeResponse } from 'src/common/decorators/api-envelope-response.decorator';
import {
  CreatePostDto,
  CreateReplyDto,
  PinPostQueryDto,
  PostQueryDto,
  ReplyQueryDto,
  SearchPostsDto,
  UpdatePostDto,
} from './dto/requests';
import {
  CreatePostResponseDto,
  PostActionResponseDto,
  PostResponseDto,
  PostsPageResponseDto,
  RepliesPageResponseDto,
} from './dto/responses';
import 'multer';
import { RateLimit } from 'src/rate-limit/token.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create-post')
  @RateLimit({ capacity: 100, refillRate: 10 / 60 })
  @UseInterceptors(FilesInterceptor('images', IMAGE_UPLOAD.MAX_POST_IMAGES))
  @ApiOperation({ summary: 'Create a post' })
  @ApiEnvelopeResponse(CreatePostResponseDto, { status: 201 })
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
  ): Promise<CreatePostResponseDto> {
    const post = await this.postsService.create(userId, createPostDto, images);
    return {
      message: 'Post created successfully',
      post,
    };
  }

  @Get('/users/:username')
  @RateLimit({ capacity: 300, refillRate: 100 / 60 })
  @ApiOperation({ summary: 'Get posts by username' })
  @ApiEnvelopeResponse(PostsPageResponseDto)
  getPostByUsername(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
    @Query() query: PostQueryDto,
  ): Promise<PostsPageResponseDto> {
    return this.postsService.getPostByUsername(userId, username, query);
  }

  @Get('search')
  @RateLimit({ capacity: 500, refillRate: 100 / 60 })
  @ApiOperation({ summary: 'Search posts' })
  @ApiEnvelopeResponse(PostsPageResponseDto)
  searchPosts(
    @CurrentUser('id') userId: string,
    @Query() query: SearchPostsDto,
  ): Promise<PostsPageResponseDto> {
    return this.postsService.searchPosts(userId, query);
  }

  @Get('post-detail/:postId')
  @RateLimit({ capacity: 300, refillRate: 100 / 60 })
  @ApiOperation({ summary: 'Get post detail' })
  @ApiEnvelopeResponse(PostResponseDto)
  getPostDetail(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<PostResponseDto> {
    return this.postsService.getPostDetail(userId, postId);
  }

  @Patch('/update-post/:postId')
  @RateLimit({ capacity: 300, refillRate: 100 / 60 })
  @UseInterceptors(FilesInterceptor('images', IMAGE_UPLOAD.MAX_POST_IMAGES))
  @ApiOperation({ summary: 'Update a post' })
  @ApiEnvelopeResponse(PostResponseDto)
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
  ): Promise<PostResponseDto> {
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
  @ApiOperation({ summary: 'Create a reply' })
  @ApiEnvelopeResponse(PostResponseDto, { status: 201 })
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
  ): Promise<PostResponseDto> {
    return this.postsService.createReply(
      userId,
      postId,
      createReplyDto,
      images,
    );
  }

  @Get(':postId/replies')
  @RateLimit({ capacity: 500, refillRate: 100 / 60 })
  @ApiOperation({ summary: 'Get post replies' })
  @ApiEnvelopeResponse(RepliesPageResponseDto)
  getReplies(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Query() query: ReplyQueryDto,
  ): Promise<RepliesPageResponseDto> {
    return this.postsService.getReplies(
      userId,
      postId,
      query.cursor,
      query.limit,
    );
  }

  @Get('/users/pin-post/:username')
  @RateLimit({ capacity: 300, refillRate: 100 / 60 })
  @ApiOperation({ summary: 'Get pinned posts by username' })
  @ApiEnvelopeResponse(PostsPageResponseDto)
  async getPinPost(
    @Param('username') username: string,
    @CurrentUser('id') userId: string,
    @Query() query: PinPostQueryDto,
  ): Promise<PostsPageResponseDto> {
    return this.postsService.getPinPost(username, userId, query);
  }
  @Post(':postId/pin')
  @ApiOperation({ summary: 'Pin a post' })
  @ApiEnvelopeResponse(PostActionResponseDto, { status: 201 })
  async pinPost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<PostActionResponseDto> {
    return this.postsService.pinPost(userId, postId);
  }

  @Delete(':postId/unpin')
  @RateLimit({ capacity: 100, refillRate: 100 / 60 })
  @ApiOperation({ summary: 'Unpin a post' })
  @ApiEnvelopeResponse(PostActionResponseDto)
  async unpinPost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<PostActionResponseDto> {
    return this.postsService.unpinPost(userId, postId);
  }
}
