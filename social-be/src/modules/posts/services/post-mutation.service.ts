import { Injectable } from '@nestjs/common';
import { UpdatePostDto } from '../dto/requests';
import { PostDeleteService } from './post-delete.service';
import { PostUpdateService } from './post-update.service';

@Injectable()
export class PostMutationService {
  constructor(
    private readonly postDeletes: PostDeleteService,
    private readonly postUpdates: PostUpdateService,
  ) {}

  update(
    userId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
    images?: Express.Multer.File[],
  ) {
    return this.postUpdates.update(userId, postId, updatePostDto, images);
  }

  delete(userId: string, postId: string) {
    return this.postDeletes.delete(userId, postId);
  }
}
