import { Injectable } from '@nestjs/common';
import { PostQueryDto, SearchPostsDto } from '../dto/requests';
import { PostDetailService } from './post-detail.service';
import { PostSearchService } from './post-search.service';
import { PostUserQueryService } from './post-user-query.service';

@Injectable()
export class PostQueryService {
  constructor(
    private readonly postDetails: PostDetailService,
    private readonly postSearch: PostSearchService,
    private readonly postUserQueries: PostUserQueryService,
  ) {}

  getPostByUsername(
    currentUserId: string,
    username: string,
    query: PostQueryDto,
  ) {
    return this.postUserQueries.getPostByUsername(currentUserId, username, query);
  }

  searchPosts(currentUserId: string, query: SearchPostsDto) {
    return this.postSearch.searchPosts(currentUserId, query);
  }

  getPostDetail(userId: string, postId: string) {
    return this.postDetails.getPostDetail(userId, postId);
  }
}
