import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ReportCommentDto } from './dto/report-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    const comment = await this.commentsService.create(createCommentDto, user.userId, postId);
    return {
      message: 'Comentario creado exitosamente',
      comment,
    };
  }

  @Public()
  @Get()
  async getComments(
    @Param('postId') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user?: any,
  ) {
    return this.commentsService.findByPost(postId, page, limit, user?.userId);
  }
}

@Controller('comments')
export class CommentsController2 {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Put(':commentId')
  async update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: any,
  ) {
    const comment = await this.commentsService.update(commentId, updateCommentDto, user.userId);
    return {
      message: 'Comentario actualizado exitosamente',
      comment,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':commentId')
  async remove(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    await this.commentsService.remove(commentId, user.userId, user.role === 'ADMIN');
    return {
      message: 'Comentario eliminado exitosamente',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':commentId/like')
  async toggleLike(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    const result = await this.commentsService.toggleLike(commentId, user.userId);
    return {
      message: 'Like actualizado',
      ...result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':commentId/report')
  async report(
    @Param('commentId') commentId: string,
    @Body() reportDto: ReportCommentDto,
    @CurrentUser() user: any,
  ) {
    await this.commentsService.report(commentId, user.userId, reportDto);
    return {
      message: 'Reporte enviado exitosamente. Los administradores lo revisarán.',
    };
  }
}

