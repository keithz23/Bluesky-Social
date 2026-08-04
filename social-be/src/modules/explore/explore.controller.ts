import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { ExploreQueryDto } from './dto/explore-query.dto';
import { ExploreService } from './explore.service';

@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getExplore(
    @Query() query: ExploreQueryDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.exploreService.getExplore(currentUserId ?? null, query);
  }
}
