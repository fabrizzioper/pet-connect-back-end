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

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: any) {
    const post = await this.postsService.create(createPostDto, user.userId);
    return {
      message: 'Publicación creada exitosamente',
      post,
    };
  }

  @Public()
  @Get('feed')
  async getFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('category') category: string,
    @CurrentUser() user?: any,
  ) {
    return this.postsService.getFeed(page, limit, category, user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed/following')
  async getFollowingFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user: any,
  ) {
    return this.postsService.getFollowingFeed(user.userId, page, limit);
  }

  @Public()
  @Get(':postId')
  async getPost(@Param('postId') postId: string, @CurrentUser() user?: any) {
    return this.postsService.findById(postId, user?.userId);
  }

  @Public()
  @Get('user/:userId')
  async getUserPosts(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findByUser(userId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId')
  async update(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: any,
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
  async remove(@Param('postId') postId: string, @CurrentUser() user: any) {
    await this.postsService.remove(postId, user.userId, user.role === 'ADMIN');
    return {
      message: 'Publicación eliminada exitosamente',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/like')
  async toggleLike(@Param('postId') postId: string, @CurrentUser() user: any) {
    const result = await this.postsService.toggleLike(postId, user.userId);
    return {
      message: 'Like actualizado',
      ...result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/report')
  async report(
    @Param('postId') postId: string,
    @Body() reportDto: ReportPostDto,
    @CurrentUser() user: any,
  ) {
    await this.postsService.report(postId, user.userId, reportDto);
    return {
      message: 'Reporte enviado exitosamente. Los administradores lo revisarán.',
    };
  }
}

