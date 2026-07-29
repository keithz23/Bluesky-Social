import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KeywordsService } from './keywords.service';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { UpdateKeywordDto } from './dto/update-keyword.dto';
import { KeywordQueryDto } from './dto/keyword-query.dto';
import { DeleteKeywordDto } from './dto/delete-keyword.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';

@UseGuards(PermissionsGuard)
@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Post()
  @Permissions('keyword:create')
  create(@Body() createKeywordDto: CreateKeywordDto) {
    return this.keywordsService.create(createKeywordDto);
  }

  @Get()
  @Permissions('keyword:read')
  findAll(@Query() query: KeywordQueryDto) {
    return this.keywordsService.findAll(query);
  }

  @Get(':keywordId')
  @Permissions('keyword:read')
  findOne(@Param('keywordId') keywordId: string) {
    return this.keywordsService.findOne(keywordId);
  }

  @Patch(':keywordId')
  @Permissions('keyword:update')
  update(
    @Param('keywordId') keywordId: string,
    @Body() updateKeywordDto: UpdateKeywordDto,
  ) {
    return this.keywordsService.update(keywordId, updateKeywordDto);
  }

  @Delete()
  @Permissions('keyword:delete')
  delete(@Body() deleteKeywordDto: DeleteKeywordDto) {
    return this.keywordsService.delete(deleteKeywordDto);
  }
}
