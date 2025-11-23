import {
  Controller,
  Get,
  Delete,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BlockUserDto } from './dto/block-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reports')
  async getReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status: string,
  ) {
    return this.adminService.getReports(page, limit, status);
  }

  @Delete('posts/:postId')
  async deletePost(
    @Param('postId') postId: string,
    @Body() body?: { reason?: string },
  ) {
    await this.adminService.deletePost(postId, body?.reason);
    return {
      message: 'Publicación eliminada por administrador',
    };
  }

  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string) {
    await this.adminService.deleteComment(commentId);
    return {
      message: 'Comentario eliminado por administrador',
    };
  }

  @Put('users/:userId/block')
  async blockUser(
    @Param('userId') userId: string,
    @Body() blockUserDto: BlockUserDto,
  ) {
    const user = await this.adminService.blockUser(
      userId,
      blockUserDto.blocked,
      blockUserDto.reason,
    );
    return {
      message: blockUserDto.blocked
        ? 'Usuario bloqueado exitosamente'
        : 'Usuario desbloqueado exitosamente',
      user: {
        _id: user._id,
        username: user.username,
        isActive: user.isActive,
      },
    };
  }

  @Get('statistics')
  async getStatistics() {
    return this.adminService.getStatistics();
  }
}

