import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, Matches } from 'class-validator';
import {
  DATE_ONLY_MESSAGE,
  DATE_ONLY_PATTERN,
} from 'src/common/constants/user-validation.constant';

export class ChangeDateOfBirthDto {
  @ApiProperty({ example: '1999-05-15', type: String, format: 'date' })
  @IsNotEmpty()
  @Matches(DATE_ONLY_PATTERN, { message: DATE_ONLY_MESSAGE })
  @IsDateString({ strict: true })
  dateOfBirth!: string;
}
