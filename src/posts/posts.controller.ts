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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { JwtUser } from '../common/types/jwt-user.type';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: JwtUser) {
    const post = await this.postsService.create(createPostDto, user.userId);
    return {
      message: 'Publicación creada exitosamente',
      post,
    };
  }

  @UseGuards(JwtAuthGuard) // Aplicar el guard explícitamente para que valide el token
  @Public() // Marcar como público para que no requiera autenticación obligatoria
  @Get('feed')
  async getFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('category') category: string,
    @CurrentUser() user?: JwtUser,
  ) {
    console.log('🟡 PostsController.getFeed - user recibido:', user ? { userId: user.userId, email: user.email } : 'undefined');
    const userId = user?.userId;
    console.log('🟡 PostsController.getFeed - userId a pasar al servicio:', userId);
    const result = await this.postsService.getFeed(page, limit, category, userId);
    // Incluir userId en la respuesta para que el frontend sepa quién está autenticado
    console.log('🟡 PostsController.getFeed - currentUserId en respuesta:', userId || null);
    return {
      ...result,
      currentUserId: userId || null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed/following')
  async getFollowingFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user: JwtUser,
  ) {
    return this.postsService.getFollowingFeed(user.userId, page, limit);
  }

  @UseGuards(JwtAuthGuard) // Aplicar el guard explícitamente para que valide el token
  @Public() // Marcar como público para que no requiera autenticación obligatoria
  @Get(':postId')
  async getPost(@Param('postId') postId: string, @CurrentUser() user?: JwtUser) {
    return this.postsService.findById(postId, user?.userId);
  }

  @UseGuards(JwtAuthGuard) // Aplicar el guard explícitamente para que valide el token
  @Public() // Marcar como público para que no requiera autenticación obligatoria
  @Get('user/:userId')
  async getUserPosts(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.postsService.findByUser(userId, page, limit, user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId')
  async update(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: JwtUser,
  ) {
    const post = await this.postsService.update(postId, updatePostDto, user.userId);
    return {
      message: 'Publicación actualizada exitosamente',
      post,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':postId')
  async remove(@Param('postId') postId: string, @CurrentUser() user: JwtUser) {
    await this.postsService.remove(postId, user.userId, user.role === 'ADMIN');
    return {
      message: 'Publicación eliminada exitosamente',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId/like')
  async toggleLike(@Param('postId') postId: string, @CurrentUser() user: JwtUser) {
    const result = await this.postsService.toggleLike(postId, user.userId);
    // Incluir userId en la respuesta
    return {
      message: 'Like actualizado',
      ...result,
      userId: user.userId,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/report')
  async report(
    @Param('postId') postId: string,
    @Body() reportDto: ReportPostDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.postsService.report(postId, user.userId, reportDto);
    return {
      message: 'Reporte enviado exitosamente. Los administradores lo revisarán.',
    };
  }
}

