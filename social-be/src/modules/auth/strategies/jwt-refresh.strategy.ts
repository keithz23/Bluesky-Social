import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => {
        if (!req?.cookies?.refreshToken)
          throw new UnauthorizedException('Refresh token missing');
        return req?.cookies?.refreshToken;
      },
      passReqToCallback: true,
      secretOrKey:
        configService.get<string>('config.jwt.refreshSecret') ||
        configService.get<string>('config.jwt.secret') ||
        '',
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
