import { Injectable } from '@nestjs/common';
import {
  ChangeDateOfBirthDto,
  ChangeUsernameDto,
  SearchUsersQueryDto,
  UpdateAccountPrivacyDto,
  UpdateProfileDto,
} from './dto/requests';
import {
  CurrentUserResponseDto,
  ProfileResponseDto,
  UserSearchItemResponseDto,
} from './dto/responses';
import { UserProfileService } from './services/user-profile.service';
import { UserSearchService } from './services/user-search.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly profileService: UserProfileService,
    private readonly searchService: UserSearchService,
  ) {}

  search(
    userId: string,
    query: SearchUsersQueryDto,
  ): Promise<UserSearchItemResponseDto[]> {
    return this.searchService.search(userId, query);
  }

  getPublicProfile(
    username: string,
    currentUserId: string,
  ): Promise<ProfileResponseDto> {
    return this.profileService.getPublicProfile(username, currentUserId);
  }

  updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    avatar?: Express.Multer.File[],
    cover?: Express.Multer.File[],
  ): Promise<CurrentUserResponseDto> {
    return this.profileService.updateProfile(userId, dto, avatar, cover);
  }

  changeUsername(
    userId: string,
    dto: ChangeUsernameDto,
  ): Promise<CurrentUserResponseDto> {
    return this.profileService.changeUsername(userId, dto);
  }

  changeDateOfBirth(
    userId: string,
    dto: ChangeDateOfBirthDto,
  ): Promise<CurrentUserResponseDto> {
    return this.profileService.changeDateOfBirth(userId, dto);
  }

  updatePrivacy(
    userId: string,
    dto: UpdateAccountPrivacyDto,
  ): Promise<CurrentUserResponseDto> {
    return this.profileService.updatePrivacy(userId, dto);
  }
}
