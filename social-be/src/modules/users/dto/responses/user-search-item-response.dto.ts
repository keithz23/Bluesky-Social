import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserSearchItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty() displayName!: string;
  @ApiPropertyOptional({ nullable: true }) bio!: string | null;
  @ApiPropertyOptional({ nullable: true }) avatarUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) coverUrl!: string | null;
  @ApiProperty() verified!: boolean;
  @ApiProperty() isAdded!: boolean;
}
