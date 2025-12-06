import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmailOrUsername(email: string, username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      $or: [{ email }, { username }],
    }).exec();
  }

  async findByIdPublic(id: string, currentUserId?: string) {
    const user = await this.userModel.findById(id)
      .select('-password -email')
      .populate('pets', 'name type photos')
      .exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userObj = user.toObject();
    const followersCount = user.followers.length;
    const followingCount = user.following.length;
    
    let isFollowing = false;
    if (currentUserId) {
      const currentUser = await this.userModel.findById(currentUserId);
      isFollowing = currentUser?.following.some(
        (id) => id.toString() === user._id.toString()
      ) || false;
    }

    return {
      ...userObj,
      followersCount,
      followingCount,
      isFollowing,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new NotFoundException('Contraseña actual incorrecta');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  }

  async getMyProfile(userId: string) {
    const user = await this.userModel.findById(userId)
      .populate('pets', 'name type photos')
      .exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userObj = user.toObject();
    const followersCount = user.followers.length;
    const followingCount = user.following.length;
    
    // Get posts count
    const postsCount = await this.userModel.aggregate([
      { $match: { _id: user._id } },
      { $lookup: { from: 'posts', localField: '_id', foreignField: 'author', as: 'posts' } },
      { $project: { postsCount: { $size: '$posts' } } },
    ]);

    return {
      ...userObj,
      password: undefined,
      followersCount,
      followingCount,
      postsCount: postsCount[0]?.postsCount || 0,
    };
  }

  async followUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new Error('No puedes seguirte a ti mismo');
    }

    const currentUser = await this.userModel.findById(currentUserId);
    const targetUser = await this.userModel.findById(targetUserId);

    if (!currentUser) {
      throw new NotFoundException('Usuario actual no encontrado');
    }

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId,
    );

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId,
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId,
      );
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    return {
      following: !isFollowing,
      followersCount: targetUser.followers.length,
    };
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 10) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const skip = (page - 1) * limit;
    const followers = await this.userModel
      .find({ _id: { $in: user.followers } })
      .select('username fullName profilePicture')
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      followers,
      pagination: {
        page,
        limit,
        total: user.followers.length,
        totalPages: Math.ceil(user.followers.length / limit),
      },
    };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 10) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const skip = (page - 1) * limit;
    const following = await this.userModel
      .find({ _id: { $in: user.following } })
      .select('username fullName profilePicture')
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      following,
      pagination: {
        page,
        limit,
        total: user.following.length,
        totalPages: Math.ceil(user.following.length / limit),
      },
    };
  }
}

