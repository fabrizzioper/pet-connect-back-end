import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;
}



