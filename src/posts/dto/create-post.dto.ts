import { IsString, IsEnum, IsOptional, IsArray, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MediaDto {
  @IsEnum(['image', 'video'])
  type: string;

  @IsString()
  url: string;
}

export class CreatePostDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsString()
  @IsOptional()
  petId?: string;

  @IsEnum(['dog', 'cat', 'bird', 'exotic', 'other'])
  category: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @IsOptional()
  media?: MediaDto[];
}

