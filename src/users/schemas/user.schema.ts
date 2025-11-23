import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  fullName: string;

  @Prop({ maxlength: 500 })
  bio: string;

  @Prop()
  profilePicture: string;

  @Prop({ enum: ['USER', 'ADMIN'], default: 'USER', index: true })
  role: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Pet' }], default: [] })
  pets: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  followers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  following: Types.ObjectId[];

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);



