import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.usersService.getMyProfile(user.userId);
  }

  @Public()
  @Get(':userId')
  async getUserProfile(
    @Param('userId') userId: string,
    @CurrentUser() currentUser?: any,
  ) {
    return this.usersService.findByIdPublic(userId, currentUser?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.update(user.userId, updateUserDto);
    return {
      message: 'Perfil actualizado exitosamente',
      user: updatedUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.userId, changePasswordDto);
    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/follow')
  async followUser(
    @CurrentUser() user: any,
    @Param('userId') targetUserId: string,
  ) {
    const result = await this.usersService.followUser(user.userId, targetUserId);
    return {
      message: result.following 
        ? `Ahora sigues a ${targetUserId}` 
        : `Ya no sigues a ${targetUserId}`,
      ...result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':userId/follow')
  async unfollowUser(
    @CurrentUser() user: any,
    @Param('userId') targetUserId: string,
  ) {
    const result = await this.usersService.followUser(user.userId, targetUserId);
    return {
      message: result.following 
        ? `Ahora sigues a ${targetUserId}` 
        : `Ya no sigues a ${targetUserId}`,
      ...result,
    };
  }

  @Public()
  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getFollowers(userId, page, limit);
  }

  @Public()
  @Get(':userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getFollowing(userId, page, limit);
  }
}

