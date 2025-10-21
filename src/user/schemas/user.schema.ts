import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  username: string;

  @Prop()
  fullname: string;

  @Prop()
  password: string;

  @Prop()
  avatar: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ username: 1 });
