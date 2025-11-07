import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/services/user.service';
import { RegisterDto } from '../dto/register.dto';
import { User, UserDocument } from '../../user/schemas/user.schema';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    try {
      const user = await this.userService.findByUsername(username);
      if (!user) {
        this.logger.warn(`Login attempt with non-existent username: ${username}`);
        return null;
      }

      if (!user.password) {
        this.logger.warn(`User ${username} has no password (OAuth account)`);
        return null;
      }

      const isPasswordValid = await this.userService.validatePassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for user: ${username}`);
        return null;
      }

      const userObject = (user as UserDocument).toObject();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = userObject;
      return result as Omit<UserDocument, 'password'>;
    } catch (error) {
      this.logger.error(`Error validating user ${username}:`, error);
      return null;
    }
  }

  login(user: UserDocument | Omit<UserDocument, 'password'>): AuthResponse {
    const userId = (user as any)._id?.toString() || (user as any).id;
    
    if (!userId) {
      this.logger.error('User ID is missing in login method');
      throw new UnauthorizedException('Invalid user data');
    }

    const payload: JwtPayload = {
      username: user.username,
      sub: userId,
    };

    const token = this.jwtService.sign(payload);
    this.logger.log(`User ${user.username} logged in successfully`);

    return {
      access_token: token,
      user: {
        id: userId,
        username: user.username,
        fullname: user.fullname || '',
        avatar: user.avatar || '',
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const user = await this.userService.create(registerDto);
      const userDoc = user as UserDocument;

      if (!userDoc._id) {
        this.logger.error('User created without ID');
        throw new UnauthorizedException('User registration failed');
      }

      this.logger.log(`New user registered: ${user.username}`);

      const payload: JwtPayload = {
        username: user.username,
        sub: userDoc._id.toString(),
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: userDoc._id.toString(),
          username: user.username,
          fullname: user.fullname || '',
          avatar: user.avatar || '',
        },
      };
    } catch (error) {
      this.logger.error(`Registration failed for ${registerDto.username}:`, error);
      throw error;
    }
  }

  async validateUserById(userId: string | Types.ObjectId): Promise<User> {
    try {
      const user = await this.userService.findOne(userId);
      if (!user) {
        this.logger.warn(`JWT validation failed: User ${userId} not found`);
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`Error validating user by ID ${userId}:`, error);
      throw error instanceof UnauthorizedException
        ? error
        : new UnauthorizedException('Invalid token');
    }
  }

  async findOrCreateGoogleUser(profile: any): Promise<User> {
    try {
      const email = profile.emails?.[0]?.value;
      const username = email || profile.id;

      if (!username) {
        this.logger.error('Google profile missing required data');
        throw new UnauthorizedException('Invalid Google profile');
      }

      let user = await this.userService.findByUsername(username);

      if (!user) {
        this.logger.log(`Creating new user from Google profile: ${username}`);
        user = await this.userService.createFromGoogle({
          username,
          fullname: profile.displayName || '',
          avatar: profile.photos?.[0]?.value,
          googleId: profile.id,
        });
      } else {
        this.logger.log(`Existing user logged in via Google: ${username}`);
      }

      return user;
    } catch (error) {
      this.logger.error('Error in Google OAuth flow:', error);
      throw error;
    }
  }
}
