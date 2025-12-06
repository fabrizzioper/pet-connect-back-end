import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface Report {
  user: Types.ObjectId;
  reason: string;
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  author: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Pet', index: true })
  pet: Types.ObjectId;

  @Prop({ maxlength: 2000 })
  content: string;

  @Prop({ 
    type: [{
      type: { type: String, enum: ['image', 'video'] },
      url: String
    }],
    default: []
  })
  media: MediaItem[];

  @Prop({ 
    required: true,
    enum: ['dog', 'cat', 'bird', 'exotic', 'other'],
    index: true 
  })
  category: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Comment' }], default: [] })
  comments: Types.ObjectId[];

  @Prop({
    type: [{
      user: { type: Types.ObjectId, ref: 'User' },
      reason: String,
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  })
  reports: Report[];

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });

