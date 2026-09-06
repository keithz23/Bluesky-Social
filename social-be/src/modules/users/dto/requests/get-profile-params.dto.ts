import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  USERNAME_LOOKUP_PATTERN,
  USERNAME_LOOKUP_PATTERN_MESSAGE,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from 'src/common/constants/user-validation.constant';

export class GetProfileParamsDto {
  @IsString()
  @MinLength(USERNAME_MIN_LENGTH)
  @MaxLength(USERNAME_MAX_LENGTH)
  @Matches(USERNAME_LOOKUP_PATTERN, {
    message: USERNAME_LOOKUP_PATTERN_MESSAGE,
  })
  username!: string;
}
