# PetConnect Backend

Backend API para PetConnect - Red Social para Amantes de los Animales

## Stack Tecnológico

- **Framework**: NestJS
- **Base de Datos**: MongoDB
- **Autenticación**: JWT
- **Validación**: class-validator, class-transformer
- **Contenedores**: Docker

## Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- npm

## Instalación

```bash
npm install
```

## Configuración

1. El archivo `.env` ya está configurado con todas las variables necesarias
2. Verifica que las variables estén correctas según tu entorno

## Levantar Base de Datos MongoDB

```bash
# Levantar MongoDB en contenedor Docker
docker-compose up -d mongodb

# Ver logs del contenedor
docker-compose logs -f mongodb

# Detener MongoDB
docker-compose down
```

## Ejecutar la aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Probar Endpoints

### Pruebas por Rol

```bash
# Pruebas como VISITANTE (no registrado - solo lectura pública)
npm run test:visitor
# O: ./scripts/test-visitor.sh

# Pruebas como USUARIO REGISTRADO (puede crear y modificar su contenido)
npm run test:user
# O: ./scripts/test-user.sh

# Pruebas como ADMINISTRADOR (acceso completo)
npm run test:admin
# O: ./scripts/test-admin.sh

# Pruebas completas (todos los endpoints)
npm run test:endpoints
# O: ./scripts/test-endpoints.sh
```

### Con URL personalizada

```bash
./scripts/test-visitor.sh http://localhost:3000
./scripts/test-user.sh http://localhost:3000
./scripts/test-admin.sh http://localhost:3000
```

**Nota importante para pruebas de Admin:**
- El script `test-admin.sh` crea un usuario, pero necesitas cambiar su rol a `ADMIN` en la base de datos
- O usar un usuario admin existente modificando el script

## Estructura del Proyecto

```
src/
├── auth/              # Autenticación y autorización
├── users/             # Gestión de usuarios
├── pets/              # Gestión de mascotas
├── posts/             # Publicaciones
├── comments/          # Comentarios
├── categories/        # Categorías temáticas
├── admin/             # Panel de administración
├── search/            # Búsqueda
└── common/            # Guards, decorators, interfaces
```

## Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/verify` - Verificar token

### Usuarios
- `GET /api/users/me` - Perfil del usuario actual
- `GET /api/users/:userId` - Perfil de otro usuario
- `PUT /api/users/me` - Actualizar perfil
- `POST /api/users/:userId/follow` - Seguir usuario

### Publicaciones
- `GET /api/posts/feed` - Feed de publicaciones
- `POST /api/posts` - Crear publicación
- `POST /api/posts/:postId/like` - Dar like

Ver `backend-petconnect-mvp.md` para documentación completa de todos los endpoints.

## Docker

### Solo MongoDB
```bash
docker-compose up -d mongodb
```

### Todo el stack (cuando esté listo)
```bash
docker-compose up -d
```

## Variables de Entorno

Todas las variables están en el archivo `.env`:

- `MONGODB_URI` - URI de conexión a MongoDB
- `JWT_SECRET` - Secret key para JWT (ya generado)
- `JWT_EXPIRES_IN` - Tiempo de expiración del token
- `PORT` - Puerto del servidor
- `CORS_ORIGIN` - Origen permitido para CORS

**Importante**: No hay fallbacks en el código. Todas las variables deben estar en el `.env`.

## Desarrollo

El proyecto está configurado para desarrollo con:
- Hot reload activado
- Validación automática de DTOs
- CORS habilitado
- Logs detallados

## Producción

Para producción:
1. Actualiza las variables de entorno en `.env`
2. Genera un nuevo `JWT_SECRET` seguro
3. Configura `NODE_ENV=production`
4. Ejecuta `npm run build`
5. Ejecuta `npm run start:prod`
