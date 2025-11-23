import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async searchUsers(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const users = await this.userModel
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } },
        ],
        isActive: true,
      })
      .select('username fullName profilePicture')
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.userModel.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
      isActive: true,
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchPosts(query: string, category?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const match: any = {
      $or: [
        { content: { $regex: query, $options: 'i' } },
      ],
      isActive: true,
    };

    if (category) {
      match.category = category;
    }

    const posts = await this.postModel
      .find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .populate('pet', 'name type photos')
      .exec();

    const total = await this.postModel.countDocuments(match);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}



