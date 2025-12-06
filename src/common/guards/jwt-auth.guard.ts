import { Injectable, ExecutionContext, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import type { JwtUser } from '../types/jwt-user.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Para endpoints públicos, intentar validar el token si está presente
      const request = context.switchToHttp().getRequest();
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Si hay token, intentar validarlo y extraer el usuario
        try {
          // Validar el token manualmente
          const secret = this.configService.get<string>('JWT_SECRET');
          if (!secret) {
            request.user = undefined;
            return true;
          }

          const payload = jwt.verify(token, secret) as { sub: string; email: string; role: string };
          
          // Obtener el usuario completo desde la base de datos
          const user = await this.usersService.findById(payload.sub);
          
          let jwtUser: JwtUser | undefined = undefined;
          if (user && user.isActive) {
            jwtUser = {
              userId: user._id.toString(),
              email: user.email,
              role: user.role as 'USER' | 'ADMIN',
            };
          }
          
          // Establecer el usuario en request.user ANTES de que el controller se ejecute
          request.user = jwtUser || undefined;
          console.log('🟡 JwtAuthGuard.canActivate (público) - user establecido:', jwtUser ? { userId: jwtUser.userId, email: jwtUser.email } : 'undefined');
          
          return true;
        } catch (error) {
          // Si falla la validación (token inválido), permitir acceso sin usuario
          console.log('🟡 JwtAuthGuard.canActivate (público) - error validando token:', error.message);
          request.user = undefined;
          return true;
        }
      }
      // Si no hay token, permitir acceso pero sin usuario
      request.user = undefined;
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si es endpoint público, no lanzar error si no hay usuario
    if (isPublic) {
      // Si hay un error pero es porque no hay token o el usuario no existe/inactivo
      if (err) {
        // Solo ignorar errores relacionados con tokens faltantes, inválidos, o usuarios no encontrados
        if (info && (
          info.name === 'JsonWebTokenError' || 
          info.name === 'TokenExpiredError' || 
          info.message === 'No auth token' ||
          err.message?.includes('Usuario no encontrado') ||
          err.message?.includes('inactivo')
        )) {
          // Asegurar que request.user sea undefined
          const request = context.switchToHttp().getRequest();
          request.user = undefined;
          return undefined;
        }
        // Si es otro tipo de error, lanzarlo
        throw err;
      }
      // IMPORTANTE: Establecer request.user con el usuario si existe
      // Esto asegura que el decorator @CurrentUser() pueda obtener el usuario
      const request = context.switchToHttp().getRequest();
      request.user = user || undefined;
      console.log('🟡 JwtAuthGuard.handleRequest (público) - user:', user ? { userId: user.userId, email: user.email } : 'undefined');
      return user || undefined;
    }

    // Para endpoints protegidos, requerir usuario válido
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    // Asegurar que request.user esté establecido
    const request = context.switchToHttp().getRequest();
    request.user = user;
    return user;
  }
}

