import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsController, CommentsController2 } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    UsersModule, // Importar UsersModule para que JwtAuthGuard pueda usar UsersService
  ],
  controllers: [CommentsController, CommentsController2],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}

