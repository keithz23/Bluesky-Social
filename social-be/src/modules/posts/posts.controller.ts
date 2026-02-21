import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ImageValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

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

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
