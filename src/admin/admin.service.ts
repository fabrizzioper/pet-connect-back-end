import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Pet, PetDocument } from '../pets/schemas/pet.schema';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
  ) {}

  async getReports(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const match: any = {};
    
    if (status) {
      match.status = status;
    }

    // Get posts and comments with reports
    const postsWithReports = await this.postModel
      .find({ 'reports.0': { $exists: true } })
      .populate('reports.user', 'username email')
      .skip(skip)
      .limit(limit)
      .exec();

    const reports = postsWithReports.flatMap(post =>
      post.reports.map((report, index) => ({
        _id: `${post._id}-${index}`,
        type: 'post',
        targetId: post._id,
        reporter: report.user,
        reason: report.reason,
        status: 'pending',
        createdAt: report.createdAt,
      })),
    );

    const total = reports.length;

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deletePost(postId: string, reason?: string): Promise<void> {
    const post = await this.postModel.findByIdAndDelete(postId).exec();
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    const comment = await this.commentModel.findByIdAndDelete(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Verificar si el usuario o email ya existe
    const existingUser = await this.userModel.findOne({
      $or: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    }).exec();

    if (existingUser) {
      throw new ConflictException('El usuario o email ya existe');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateUserDto },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userModel.findByIdAndDelete(userId).exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  async blockUser(userId: string, blocked: boolean, reason?: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { isActive: !blocked } },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async getStatistics() {
    const totalUsers = await this.userModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments({ isActive: true });
    const totalPosts = await this.postModel.countDocuments();
    const totalComments = await this.commentModel.countDocuments();
    const totalPets = await this.petModel.countDocuments();

    const postsByCategory = await this.postModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const postsByCategoryObj = postsByCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const mostPopularPets = await this.postModel.aggregate([
      { $match: { isActive: true, pet: { $exists: true } } },
      { $group: { _id: '$pet', likesCount: { $sum: { $size: '$likes' } } } },
      { $sort: { likesCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'pets',
          localField: '_id',
          foreignField: '_id',
          as: 'pet',
        },
      },
      { $unwind: '$pet' },
      {
        $project: {
          petId: '$_id',
          name: '$pet.name',
          likesCount: 1,
          owner: '$pet.owner',
        },
      },
    ]);

    const reportsPending = await this.postModel.countDocuments({
      'reports.0': { $exists: true },
    });

    return {
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalPets,
      postsByCategory: postsByCategoryObj,
      mostPopularPets,
      reportsPending,
    };
  }
}

