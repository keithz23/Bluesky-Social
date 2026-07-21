import { TwoFactorMethod } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: 'clxxx...' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @Expose()
  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @Expose()
  @ApiPropertyOptional({ example: 'John Doe' })
  displayName?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Software Developer | Coffee Lover' })
  bio?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  coverUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 'google-oauth-id-123' })
  googleId?: string | null;

  @Expose()
  @ApiProperty({ example: false })
  verified!: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isPrivate!: boolean;

  @Expose()
  @ApiProperty({ example: 150 })
  followersCount!: number;

  @Expose()
  @ApiProperty({ example: 89 })
  followingCount!: number;

  @Expose()
  @ApiProperty({ example: 234 })
  postsCount!: number;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiPropertyOptional({ example: '1998-01-15' })
  dateOfBirth?: Date | null;

  @Expose()
  @ApiProperty({ example: true })
  hasPassword!: boolean;

  @Expose()
  @ApiProperty({ example: false })
  twoFactorEnabled!: boolean;

  @Expose()
  @ApiPropertyOptional({
    enum: TwoFactorMethod,
    example: TwoFactorMethod.EMAIL,
  })
  twoFactorMethod?: TwoFactorMethod | null;

  @Expose()
  @ApiPropertyOptional()
  twoFactorEnabledAt?: Date | null;
}

export class RoleResponseDto {
  @Expose()
  @ApiProperty({
    example: 'clxxx...',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    example: 'admin',
  })
  name!: string;

  @Expose()
  @ApiProperty({
    type: [String],
    example: ['user.read', 'user.write', 'post.read', 'post.delete'],
  })
  permissions!: string[];
}

export class AuthResponseDto {
  @Expose()
  @ApiProperty({
    description: 'JWT access token (expires in 15 minutes)',
  })
  accessToken!: string;

  @Expose()
  @ApiProperty({
    description: 'Refresh token (expires in 7 days)',
  })
  refreshToken!: string;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiProperty({
    type: UserResponseDto,
  })
  user!: UserResponseDto;

  @Expose()
  @Type(() => RoleResponseDto)
  @ApiProperty({
    type: [RoleResponseDto],
  })
  roles!: RoleResponseDto[];
}
