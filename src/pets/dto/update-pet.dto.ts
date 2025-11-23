import { IsString, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';

export class UpdatePetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['dog', 'cat', 'bird', 'exotic', 'other'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}



