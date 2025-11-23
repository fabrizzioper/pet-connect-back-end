import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  post: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  author: Types.ObjectId;

  @Prop({ required: true, maxlength: 500 })
  content: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ createdAt: -1 });
CommentSchema.index({ post: 1, createdAt: -1 });



