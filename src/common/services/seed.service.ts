import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const createAdmin = this.configService.get<string>('CREATE_ADMIN') === 'true';
    
    if (!createAdmin) {
      this.logger.log('CREATE_ADMIN está deshabilitado, saltando creación de admin');
      return;
    }

    await this.createAdminUser();
  }

  private async createAdminUser() {
    try {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
      const adminFullName = this.configService.get<string>('ADMIN_FULLNAME') || 'Administrator';

      if (!adminEmail || !adminUsername || !adminPassword) {
        this.logger.warn('Variables de entorno de admin no configuradas. Saltando creación de admin.');
        return;
      }

      // Verificar si el admin ya existe
      const existingAdmin = await this.userModel.findOne({
        $or: [
          { email: adminEmail },
          { username: adminUsername },
        ],
      });

      if (existingAdmin) {
        // Si existe pero no es admin, actualizar a admin
        if (existingAdmin.role !== 'ADMIN') {
          existingAdmin.role = 'ADMIN';
          await existingAdmin.save();
          this.logger.log(`Usuario ${adminEmail} actualizado a rol ADMIN`);
        } else {
          this.logger.log(`Usuario admin ${adminEmail} ya existe`);
        }
        return;
      }

      // Crear nuevo usuario admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const adminUser = new this.userModel({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        fullName: adminFullName,
        role: 'ADMIN',
        isActive: true,
      });

      await adminUser.save();
      this.logger.log(`✅ Usuario administrador creado exitosamente: ${adminEmail}`);
    } catch (error) {
      this.logger.error(`Error al crear usuario administrador: ${error.message}`);
    }
  }
}



