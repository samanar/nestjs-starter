import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  BCRYPT_SALT_ROUNDS,
  PASSWORD_MIN_LENGTH,
} from '../../common/constants/validation.constants';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private async hashPassword(password: string): Promise<string> {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      );
    }
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      if (!plainPassword || !hashedPassword) {
        return false;
      }
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error('Error validating password:', error);
      return false;
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if username already exists
      const existingUser = await this.userModel.findOne({
        username: createUserDto.username.toLowerCase(),
      });

      if (existingUser) {
        this.logger.warn(
          `Attempt to create duplicate username: ${createUserDto.username}`,
        );
        throw new ConflictException('Username already exists');
      }

      // Hash password before saving
      const hashedPassword = await this.hashPassword(createUserDto.password);
      const createdUser = new this.userModel({
        ...createUserDto,
        username: createUserDto.username.toLowerCase(),
        password: hashedPassword,
      });

      const savedUser = await createdUser.save();
      this.logger.log(`User created successfully: ${savedUser.username}`);
      return savedUser;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error creating user ${createUserDto.username}:`,
        error,
      );
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const users = await this.userModel.find().select('-password').exec();
      this.logger.log(`Retrieved ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error('Error retrieving users:', error);
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  async findOne(id: string | Types.ObjectId): Promise<User> {
    try {
      // Validate ObjectId
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const user = await this.userModel.findById(id).select('-password').exec();

      if (!user) {
        this.logger.warn(`User not found: ${id.toString()}`);
        throw new NotFoundException(`User with ID ${id.toString()} not found`);
      }

      return user;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error finding user ${id.toString()}:`, error);
      throw new BadRequestException('Failed to retrieve user');
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      if (!username) {
        return null;
      }
      // Include password for authentication purposes
      return await this.userModel
        .findOne({ username: username.toLowerCase() })
        .select('+password') // Explicitly include password field
        .exec();
    } catch (error) {
      this.logger.error(`Error finding user by username ${username}:`, error);
      return null;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      // Validate ObjectId
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Check if username is being updated and if it already exists
      if (updateUserDto.username) {
        const existingUser = await this.userModel.findOne({
          username: updateUserDto.username.toLowerCase(),
          _id: { $ne: id },
        });

        if (existingUser) {
          this.logger.warn(
            `Attempt to update to duplicate username: ${updateUserDto.username}`,
          );
          throw new ConflictException('Username already exists');
        }
      }

      // Hash password if it's being updated
      const updateData = { ...updateUserDto };
      if (updateUserDto.password) {
        updateData.password = await this.hashPassword(updateUserDto.password);
      }
      if (updateUserDto.username) {
        updateData.username = updateUserDto.username.toLowerCase();
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .select('-password')
        .exec();

      if (!updatedUser) {
        this.logger.warn(`Update failed: User not found ${id}`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`User updated successfully: ${updatedUser.username}`);
      return updatedUser;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error updating user ${id}:`, error);
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Validate ObjectId
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const result = await this.userModel.findByIdAndDelete(id).exec();

      if (!result) {
        this.logger.warn(`Delete failed: User not found ${id}`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`User deleted successfully: ${result.username}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error deleting user ${id}:`, error);
      throw new BadRequestException('Failed to delete user');
    }
  }

  async createFromGoogle(data: {
    username: string;
    fullname: string;
    avatar?: string;
    googleId: string;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({
        $or: [
          { username: data.username.toLowerCase() },
          { googleId: data.googleId },
        ],
      });

      if (existingUser) {
        this.logger.log(`Google OAuth: User already exists ${data.username}`);
        return existingUser;
      }

      // Create user without password (OAuth user)
      const createdUser = new this.userModel({
        username: data.username.toLowerCase(),
        fullname: data.fullname,
        avatar: data.avatar,
        googleId: data.googleId,
        password: undefined, // No password for OAuth users
      });

      const savedUser = await createdUser.save();
      this.logger.log(
        `Google OAuth: User created successfully ${savedUser.username}`,
      );
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error creating user from Google OAuth ${data.username}:`,
        error,
      );
      throw new BadRequestException('Failed to create user from Google OAuth');
    }
  }
}
