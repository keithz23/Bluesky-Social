import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AdminPostQueryDto } from './dto/admin-post-query.dto';
import { UpdatePostVisibilityDto } from './dto/update-post-visibility.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';

@UseGuards(PermissionsGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Permissions('post:read')
  findAll(@Query() query: AdminPostQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  @Permissions('post:read')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('post:update')
  updateVisibility(
    @Param('id') id: string,
    @Body() dto: UpdatePostVisibilityDto,
  ) {
    return this.postsService.updateVisibility(id, dto);
  }
}
