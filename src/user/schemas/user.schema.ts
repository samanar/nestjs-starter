import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true,
  })
  username: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  fullname: string;

  @Prop({
    required: false,
    select: false,
  })
  password?: string;

  @Prop({
    required: false,
    trim: true,
  })
  avatar?: string;

  @Prop({
    unique: true,
  })
  googleId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
