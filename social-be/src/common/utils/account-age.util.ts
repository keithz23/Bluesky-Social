import { BadRequestException } from '@nestjs/common';
import { MIN_ACCOUNT_AGE } from '../constants/auth-config.constant';

export function assertMinimumAccountAge(birthDate: Date): void {
  const today = new Date();
  const latestAllowedBirthDate = new Date(
    Date.UTC(
      today.getUTCFullYear() - MIN_ACCOUNT_AGE,
      today.getUTCMonth(),
      today.getUTCDate(),
    ),
  );

  if (birthDate > latestAllowedBirthDate) {
    throw new BadRequestException(
      `You must be at least ${MIN_ACCOUNT_AGE} years old.`,
    );
  }
}
