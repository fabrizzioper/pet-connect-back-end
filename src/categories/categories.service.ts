import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async findAll() {
    const categories = await this.categoryModel.find({ isActive: true }).exec();
    
    // Get posts count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await this.postModel.countDocuments({
          category: category.name,
          isActive: true,
        });
        
        return {
          ...category.toObject(),
          postsCount: count,
        };
      }),
    );

    return { categories: categoriesWithCount };
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDocument> {
    // Check if category with same name already exists
    const existingCategory = await this.categoryModel.findOne({ name: createCategoryDto.name }).exec();
    if (existingCategory) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    try {
      const category = new this.categoryModel(createCategoryDto);
      return await category.save();
    } catch (error) {
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      { $set: updateCategoryDto },
      { new: true },
    ).exec();

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    ).exec();

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
  }
}

