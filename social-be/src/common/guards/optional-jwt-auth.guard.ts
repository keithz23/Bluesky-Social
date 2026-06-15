import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.cookies?.accessToken) {
      return true;
    }

    try {
      await super.canActivate(context);
    } catch {
      return true;
    }

    return true;
  }

  handleRequest(err, user) {
    if (err || !user) {
      return null;
    }

    return user;
  }
}
