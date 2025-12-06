import {
  Controller,
  Get,
  Delete,
  Put,
  Post,
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
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

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

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.adminService.createUser(createUserDto);
    return {
      message: 'Usuario creado exitosamente',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  @Put('users/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.adminService.updateUser(userId, updateUserDto);
    return {
      message: 'Usuario actualizado exitosamente',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        bio: user.bio,
        profilePicture: user.profilePicture,
      },
    };
  }

  @Delete('users/:userId')
  async deleteUser(@Param('userId') userId: string) {
    await this.adminService.deleteUser(userId);
    return {
      message: 'Usuario eliminado exitosamente',
    };
  }

  @Get('statistics')
  async getStatistics() {
    return this.adminService.getStatistics();
  }
}



