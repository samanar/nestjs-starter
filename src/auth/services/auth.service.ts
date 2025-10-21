import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/services/user.service';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../../user/schemas/user.schema';
import { Types } from 'mongoose';

export interface JwtPayload {
  sub: string;
  username: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    fullname: string;
    avatar: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.userService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = (user as any).toObject();
    return result;
  }

  login(user: any): AuthResponse {
    const payload: JwtPayload = {
      username: user.username,
      sub: user._id?.toString() || user.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id?.toString() || user.id,
        username: user.username,
        fullname: user.fullname,
        avatar: user.avatar,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.userService.create(registerDto);
    const userObj = user as any;

    const payload: JwtPayload = {
      username: user.username,
      sub: userObj._id.toString(),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userObj._id.toString(),
        username: user.username,
        fullname: user.fullname,
        avatar: user.avatar,
      },
    };
  }

  async validateUserById(userId: string | Types.ObjectId): Promise<any> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async findOrCreateGoogleUser(profile: any): Promise<any> {
    const email = profile.emails?.[0]?.value;
    const username = email || profile.id;

    let user = await this.userService.findByUsername(username);

    if (!user) {
      // Create new user from Google profile
      user = await this.userService.createFromGoogle({
        username,
        fullname: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        googleId: profile.id,
      });
    }

    return user;
  }
}
