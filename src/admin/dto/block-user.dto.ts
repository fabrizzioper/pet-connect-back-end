import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class BlockUserDto {
  @IsBoolean()
  blocked: boolean;

  @IsString()
  @IsOptional()
  reason?: string;
}



