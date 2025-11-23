import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username solo puede contener letras, números y guiones bajos',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password debe contener al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @IsString()
  fullName: string;
}



