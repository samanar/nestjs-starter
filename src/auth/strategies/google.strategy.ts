import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret) {
      // throw new Error(
      //   'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for OAuth',
      // );
    } else {
      super({
        clientID,
        clientSecret,
        callbackURL:
          callbackURL || 'http://localhost:3000/api/auth/google/callback',
        scope: ['email', 'profile'],
      });
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): void {
    try {
      const { name, emails, photos, id } = profile;

      if (!emails || emails?.length === 0) {
        this.logger.error('Google profile missing email');
        return done(new UnauthorizedException('Email is required'), undefined);
      }

      const user: any = {
        googleId: id,
        email: emails[0].value,
        firstName: name?.givenName,
        lastName: name?.familyName,
        displayName: profile.displayName,
        picture: photos?.[0]?.value,
        accessToken,
      };

      this.logger.log(`Google OAuth successful for: ${user.email}`);
      done(null, user);
    } catch (error) {
      this.logger.error('Google OAuth validation error:', error);
      done(error, undefined);
    }
  }
}
