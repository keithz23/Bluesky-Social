import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';

@Injectable()
export class OtherUtils {
  public assertActiveAccount(user: Pick<User, 'status'>): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
  }
}
