import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ example: 'clxxx...' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'johndoe' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @Expose()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Software Developer | Coffee Lover ☕' })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @Expose()
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @Expose()
  website?: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @Expose()
  location?: string;

  @ApiProperty({ example: false })
  @Expose()
  verified: boolean;

  @ApiProperty({ example: false })
  @Expose()
  isPrivate: boolean;

  @ApiProperty({ example: 150 })
  @Expose()
  followersCount: number;

  @ApiProperty({ example: 89 })
  @Expose()
  followingCount: number;

  @ApiProperty({ example: 234 })
  @Expose()
  postsCount: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (expires in 15m)' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token (expires in 7d)' })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
