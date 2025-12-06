import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ReportPostDto } from './dto/report-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<PostDocument> {
    const post = new this.postModel({
      ...createPostDto,
      author: authorId,
      pet: createPostDto.petId || undefined,
    });
    return post.save();
  }

  async getFeed(page: number = 1, limit: number = 10, category?: string, userId?: string) {
    const skip = (page - 1) * limit;
    const match: { isActive: boolean; category?: string } = { isActive: true };
    
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

    const postsWithLikes = posts.map(post => {
      const postObj = post.toObject();
      // Verificar si el usuario dio like a este post
      // Convertir ambos a string para comparación segura
      const isLiked = userId ? post.likes.some(id => {
        const likeId = id.toString();
        const currentUserId = userId.toString();
        return likeId === currentUserId;
      }) : false;
      return {
        ...postObj,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount: post.comments ? post.comments.length : 0,
        isLiked,
        likes: undefined,
      };
    });

    return {
      posts: postsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowingFeed(userId: string, page: number = 1, limit: number = 10) {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const skip = (page - 1) * limit;
    const posts = await this.postModel
      .find({
        author: { $in: user.following },
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .populate('pet', 'name type photos')
      .exec();

    const total = await this.postModel.countDocuments({
      author: { $in: user.following },
      isActive: true,
    });

    const postsWithLikes = posts.map(post => {
      const postObj = post.toObject();
      // Convertir ambos a string para comparación segura
      const isLiked = post.likes.some(likeId => {
        const likeIdStr = likeId.toString();
        const currentUserIdStr = userId.toString();
        return likeIdStr === currentUserIdStr;
      });
      return {
        ...postObj,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount: post.comments ? post.comments.length : 0,
        isLiked,
        likes: undefined,
      };
    });

    return {
      posts: postsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId?: string): Promise<any> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username fullName profilePicture')
      .populate('pet', 'name type photos')
      .exec();

    if (!post || !post.isActive) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const postObj = post.toObject();
    // Convertir ambos a string para comparación segura
    const isLiked = userId ? post.likes.some(likeId => {
      const likeIdStr = likeId.toString();
      const currentUserIdStr = userId.toString();
      return likeIdStr === currentUserIdStr;
    }) : false;

    return {
      ...postObj,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      isLiked,
      likes: undefined,
    };
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10, currentUserId?: string) {
    const skip = (page - 1) * limit;
    const posts = await this.postModel
      .find({ author: userId, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .populate('pet', 'name type photos')
      .exec();

    const total = await this.postModel.countDocuments({ author: userId, isActive: true });

    // Agregar isLiked a cada post
    const postsWithLikes = posts.map(post => {
      const postObj = post.toObject();
      // Convertir ambos a string para comparación segura
      const isLiked = currentUserId ? post.likes.some(likeId => {
        const likeIdStr = likeId.toString();
        const currentUserIdStr = currentUserId.toString();
        return likeIdStr === currentUserIdStr;
      }) : false;
      return {
        ...postObj,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount: post.comments ? post.comments.length : 0,
        isLiked,
        likes: undefined,
      };
    });

    return {
      posts: postsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (post.author.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para actualizar esta publicación');
    }

    const updated = await this.postModel.findByIdAndUpdate(id, { $set: updatePostDto }, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return updated;
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (post.author.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para eliminar esta publicación');
    }

    await this.postModel.findByIdAndDelete(id).exec();
  }

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Asegurar que likes existe y es un array
    if (!post.likes) {
      post.likes = [];
    }

    // Convertir ambos a string para comparación segura
    const userIdStr = userId.toString();
    const isLiked = post.likes.some(id => id.toString() === userIdStr);
    
    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userIdStr);
    } else {
      // Verificar que no esté ya en el array antes de agregar
      if (!post.likes.some(id => id.toString() === userIdStr)) {
        post.likes.push(userId as unknown as typeof post.likes[0]);
      }
    }

    await post.save();

    // Recargar el post para obtener el estado actualizado
    const updatedPost = await this.postModel.findById(postId);
    const finalLikesCount = updatedPost?.likes?.length || 0;
    const finalIsLiked = updatedPost?.likes?.some(id => id.toString() === userIdStr) || false;

    return {
      liked: finalIsLiked,
      likesCount: finalLikesCount,
    };
  }

  async report(postId: string, userId: string, reportDto: ReportPostDto): Promise<void> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    post.reports.push({
      user: userId as any,
      reason: reportDto.reason,
      createdAt: new Date(),
    });

    await post.save();
  }
}

