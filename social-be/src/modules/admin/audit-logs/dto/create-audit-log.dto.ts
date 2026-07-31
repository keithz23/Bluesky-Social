import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  actorType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  userAgent?: string;

  @IsOptional()
  @IsObject()
  metadata?: Prisma.InputJsonObject;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAt?: Date;
}
