<<<<<<< HEAD
export class UpdatePostDto {}
=======
import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}
>>>>>>> origin/feat/add-staging
