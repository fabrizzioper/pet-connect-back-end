import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import type { JwtUser } from '../../common/types/jwt-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }): Promise<JwtUser | null> {
    try {
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        // Retornar null en lugar de lanzar excepción para permitir endpoints públicos
        // El guard manejará si es necesario autenticación o no
        return null;
      }
      return { 
        userId: user._id.toString(), 
        email: user.email, 
        role: user.role as 'USER' | 'ADMIN' 
      };
    } catch (error) {
      // Si hay un error al buscar el usuario, retornar null para endpoints públicos
      return null;
    }
  }
}

