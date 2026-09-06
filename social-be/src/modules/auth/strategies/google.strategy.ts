import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthUser } from '../interfaces/auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('config.google.clientId') || '',
      clientSecret:
        configService.get<string>('config.google.clientSecret') || '',
      callbackURL: configService.get<string>('config.google.callbackUrl') || '',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      done(new Error('Google account did not provide an email address'));
      return;
    }

    const user: GoogleAuthUser = {
      googleId: id,
      email,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value ?? null,
      accessToken,
    };

    done(null, user);
  }
}
