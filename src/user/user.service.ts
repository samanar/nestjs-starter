import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if username already exists
    const existingUser = await this.userModel.findOne({
      username: createUserDto.username,
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password before saving
    const hashedPassword = await this.hashPassword(createUserDto.password);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string | Types.ObjectId): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id.toString()} not found`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if username is being updated and if it already exists
    if (updateUserDto.username) {
      const existingUser = await this.userModel.findOne({
        username: updateUserDto.username,
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password if it's being updated
    const updateData = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = await this.hashPassword(updateUserDto.password);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async createFromGoogle(data: {
    username: string;
    fullname: string;
    avatar?: string;
    googleId: string;
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      username: data.username,
    });

    if (existingUser) {
      return existingUser;
    }

    // Create user without password (OAuth user)
    const createdUser = new this.userModel({
      username: data.username,
      fullname: data.fullname,
      avatar: data.avatar,
      googleId: data.googleId,
      password: null, // No password for OAuth users
    });

    return createdUser.save();
  }
}
