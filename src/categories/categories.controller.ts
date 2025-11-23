import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return {
      message: 'Categoría creada exitosamente',
      category,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put(':categoryId')
  async update(
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(categoryId, updateCategoryDto);
    return {
      message: 'Categoría actualizada exitosamente',
      category,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':categoryId')
  async remove(@Param('categoryId') categoryId: string) {
    await this.categoriesService.remove(categoryId);
    return {
      message: 'Categoría desactivada exitosamente',
    };
  }
}



