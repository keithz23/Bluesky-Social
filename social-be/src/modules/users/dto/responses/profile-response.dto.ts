import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicUserResponseDto } from './public-user-response.dto';

export enum FollowStatus {
  FOLLOWING = 'following',
  REQUESTED = 'requested',
  NONE = 'none',
}

export class ProfileResponseDto extends PublicUserResponseDto {
  @ApiPropertyOptional({ enum: FollowStatus, nullable: true })
  followStatus!: FollowStatus | null;

  @ApiProperty({ example: false })
  isOwner!: boolean;
}
