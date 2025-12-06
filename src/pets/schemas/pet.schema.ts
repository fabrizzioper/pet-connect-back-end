import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PetDocument = Pet & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Pet {
  @Prop({ required: true })
  name: string;

  @Prop({ 
    required: true, 
    enum: ['dog', 'cat', 'bird', 'exotic', 'other'],
    index: true 
  })
  type: string;

  @Prop()
  breed: string;

  @Prop()
  age: number;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop()
  profilePicture: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner: Types.ObjectId;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
PetSchema.index({ owner: 1, type: 1 });



