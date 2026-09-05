import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

function transformStringArray(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;

  try {
    const parsed: unknown = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
}

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsOptional()
  @Transform(({ value }: TransformFnParams) =>
    transformStringArray(value as unknown),
  )
  @IsArray()
  @IsString({ each: true })
  keepMediaIds?: string[];
}
