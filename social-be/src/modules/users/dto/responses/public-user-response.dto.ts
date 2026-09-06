import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Fields that are safe to expose when another user views a profile. */
export class PublicUserResponseDto {
  @ApiProperty({ example: 'clxxx...' }) id!: string;
  @ApiProperty({ example: 'johndoe' }) username!: string;
  @ApiProperty({ example: 'John Doe' }) displayName!: string;
  @ApiPropertyOptional({ nullable: true }) bio!: string | null;
  @ApiPropertyOptional({ nullable: true }) avatarUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) coverUrl!: string | null;
  @ApiProperty({ example: false }) verified!: boolean;
  @ApiProperty({ example: false }) isPrivate!: boolean;
  @ApiProperty({ example: 150 }) followersCount!: number;
  @ApiProperty({ example: 89 }) followingCount!: number;
  @ApiProperty({ example: 234 }) postsCount!: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}
