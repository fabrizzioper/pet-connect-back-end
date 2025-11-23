import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ReportCommentDto } from './dto/report-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: string, postId: string): Promise<CommentDocument> {
    const comment = new this.commentModel({
      ...createCommentDto,
      author: authorId,
      post: postId,
    });
    const savedComment = await comment.save();
    
    // Update post comments array
    const post = await this.postModel.findById(postId);
    if (post) {
      post.comments.push(savedComment._id);
      await post.save();
    }
    
    return savedComment.populate('author', 'username fullName profilePicture');
  }

  async findByPost(postId: string, page: number = 1, limit: number = 10, userId?: string) {
    const skip = (page - 1) * limit;
    const comments = await this.commentModel
      .find({ post: postId, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .exec();

    const total = await this.commentModel.countDocuments({ post: postId, isActive: true });

    const commentsWithLikes = comments.map(comment => {
      const commentObj = comment.toObject();
      const isLiked = userId ? comment.likes.some(id => id.toString() === userId) : false;
      return {
        ...commentObj,
        likesCount: comment.likes.length,
        isLiked,
        likes: undefined,
      };
    });

    return {
      comments: commentsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<CommentDocument> {
    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    if (comment.author.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para actualizar este comentario');
    }

    const updated = await this.commentModel.findByIdAndUpdate(id, { $set: updateCommentDto }, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException('Comentario no encontrado');
    }
    return updated;
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    if (comment.author.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para eliminar este comentario');
    }

    await this.commentModel.findByIdAndDelete(id).exec();
  }

  async toggleLike(commentId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const isLiked = comment.likes.some(id => id.toString() === userId);
    
    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userId as any);
    }

    await comment.save();

    return {
      liked: !isLiked,
      likesCount: comment.likes.length,
    };
  }

  async report(commentId: string, userId: string, reportDto: ReportCommentDto): Promise<void> {
    // Similar to post reports, you can implement this
    // For now, just a placeholder
  }
}

