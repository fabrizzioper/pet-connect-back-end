import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPetDto: CreatePetDto, @CurrentUser() user: any) {
    const pet = await this.petsService.create(createPetDto, user.userId);
    return {
      message: 'Mascota creada exitosamente',
      pet: {
        _id: pet._id,
        name: pet.name,
        type: pet.type,
        owner: pet.owner,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-pets')
  async getMyPets(@CurrentUser() user: any) {
    const pets = await this.petsService.findMyPets(user.userId);
    return { pets };
  }

  @Public()
  @Get(':petId')
  async getPet(@Param('petId') petId: string) {
    return this.petsService.findById(petId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':petId')
  async update(
    @Param('petId') petId: string,
    @Body() updatePetDto: UpdatePetDto,
    @CurrentUser() user: any,
  ) {
    const pet = await this.petsService.update(petId, updatePetDto, user.userId);
    return {
      message: 'Mascota actualizada exitosamente',
      pet,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':petId')
  async remove(
    @Param('petId') petId: string,
    @CurrentUser() user: any,
  ) {
    await this.petsService.remove(petId, user.userId, user.role === 'ADMIN');
    return {
      message: 'Mascota eliminada exitosamente',
    };
  }
}



