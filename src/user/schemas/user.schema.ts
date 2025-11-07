import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      // Remove sensitive fields when converting to JSON
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9_-]+$/,
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
    select: false, // Don't include password in queries by default
  })
  password?: string;

  @Prop({ 
    required: false,
    trim: true,
  })
  avatar?: string;

  @Prop({ 
    unique: true, 
    sparse: true, // Only unique if not null
    index: true,
  })
  googleId?: string;

  // Virtual for created/updated timestamps (added by timestamps: true)
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for performance
UserSchema.index({ username: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ createdAt: -1 });
