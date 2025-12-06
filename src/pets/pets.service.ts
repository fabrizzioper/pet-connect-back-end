import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
  ) {}

  async create(createPetDto: CreatePetDto, ownerId: string): Promise<PetDocument> {
    // Si hay fotos pero no profilePicture, usar la primera foto como profilePicture
    const profilePicture = createPetDto.profilePicture || 
      (createPetDto.photos && createPetDto.photos.length > 0 ? createPetDto.photos[0] : undefined);
    
    const pet = new this.petModel({
      ...createPetDto,
      profilePicture,
      owner: ownerId,
    });
    return pet.save();
  }

  async findMyPets(ownerId: string): Promise<PetDocument[]> {
    return this.petModel.find({ owner: ownerId }).exec();
  }

  async findById(id: string): Promise<PetDocument> {
    const pet = await this.petModel.findById(id).populate('owner', 'username').exec();
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }
    return pet;
  }

  async update(id: string, updatePetDto: UpdatePetDto, userId: string): Promise<PetDocument> {
    const pet = await this.petModel.findById(id);
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (pet.owner.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para actualizar esta mascota');
    }

    // Si se actualizan las fotos y no hay profilePicture, usar la primera foto
    const updateData = { ...updatePetDto };
    if (updatePetDto.photos && updatePetDto.photos.length > 0 && !updatePetDto.profilePicture) {
      updateData.profilePicture = updatePetDto.photos[0];
    }

    const updated = await this.petModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException('Mascota no encontrada');
    }
    return updated;
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const pet = await this.petModel.findById(id);
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (pet.owner.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para eliminar esta mascota');
    }

    await this.petModel.findByIdAndDelete(id).exec();
  }
}

