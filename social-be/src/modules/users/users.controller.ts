import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IMAGE_UPLOAD } from 'src/common/constants/upload.constant';
import {
  ApiEnvelopeArrayResponse,
  ApiEnvelopeResponse,
} from 'src/common/decorators/api-envelope-response.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ImageValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { RateLimit } from 'src/rate-limit/token.decorator';
import {
  ChangeDateOfBirthDto,
  ChangeUsernameDto,
  GetProfileParamsDto,
  SearchUsersQueryDto,
  UpdateAccountPrivacyDto,
  UpdateProfileDto,
} from './dto/requests';
import {
  CurrentUserResponseDto,
  ProfileResponseDto,
  UserSearchItemResponseDto,
} from './dto/responses';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @RateLimit({ capacity: 1000, refillRate: 100 / 60 })
  @ApiOperation({ summary: 'Search users' })
  @ApiEnvelopeArrayResponse(UserSearchItemResponseDto)
  searchUsers(
    @CurrentUser('id') userId: string,
    @Query() query: SearchUsersQueryDto,
  ): Promise<UserSearchItemResponseDto[]> {
    return this.usersService.search(userId, query);
  }

  @Patch('me')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiEnvelopeResponse(CurrentUserResponseDto)
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFiles(
      new ImageValidationPipe(
        IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES,
        IMAGE_UPLOAD.MAX_PROFILE_IMAGES,
      ),
    )
    files: {
      avatar?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ): Promise<CurrentUserResponseDto> {
    return this.usersService.updateProfile(
      userId,
      dto,
      files?.avatar,
      files?.cover,
    );
  }

  @Patch('me/username')
  @ApiOperation({ summary: 'Change current username' })
  @ApiEnvelopeResponse(CurrentUserResponseDto)
  changeUsername(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeUsernameDto,
  ): Promise<CurrentUserResponseDto> {
    return this.usersService.changeUsername(userId, dto);
  }

  @Patch('me/date-of-birth')
  @ApiOperation({ summary: 'Change current date of birth' })
  @ApiEnvelopeResponse(CurrentUserResponseDto)
  changeDateOfBirth(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeDateOfBirthDto,
  ): Promise<CurrentUserResponseDto> {
    return this.usersService.changeDateOfBirth(userId, dto);
  }

  @Patch('me/privacy')
  @ApiOperation({ summary: 'Update current account privacy' })
  @ApiEnvelopeResponse(CurrentUserResponseDto)
  updatePrivacy(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAccountPrivacyDto,
  ): Promise<CurrentUserResponseDto> {
    return this.usersService.updatePrivacy(userId, dto);
  }

  @Get(':username')
  @RateLimit({ capacity: 100, refillRate: 100 / 60 })
  @ApiOperation({ summary: 'Get a public user profile' })
  @ApiEnvelopeResponse(ProfileResponseDto)
  getProfile(
    @Param() params: GetProfileParamsDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<ProfileResponseDto> {
    return this.usersService.getPublicProfile(params.username, currentUserId);
  }
}
