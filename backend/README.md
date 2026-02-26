# Backend NestJS - User Management API

This is the NestJS version of the User Management API, converted from the Express backend.

## Features

- User authentication with sessions (Redis or memory-based)
- User CRUD operations
- Avatar upload/delete functionality
- User statistics endpoint
- Role-based access control (admin/regular users)
- Input validation with class-validator
- TypeORM with SQLite database

## Project Structure

```
backend-nest/
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── dto/
│   ├── users/                # Users module
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── common/               # Shared resources
│   │   ├── guards/           # Auth guards
│   │   └── helpers/          # Helper functions
│   ├── types/                # TypeScript type definitions
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── main.ts
├── test/                     # E2E and unit tests
├── assets/                   # Database and uploads
└── package.json
```

## Installation

```bash
# Install dependencies
pnpm install
```

## Running the Application

```bash
# Development mode with hot reload
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm run test:cov

# Run tests in watch mode
pnpm run test:watch
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT`: Server port (default: 1000)
- `NODE_ENV`: Environment (development/production/test)
- `COOKIE_NAME`: Session cookie name
- `SESSION_SECRET`: Secret for session encryption
- `USE_REDIS_SESSION`: Enable Redis session store (true/false)
- `VALKEY_HOST`: Redis/Valkey host
- `VALKEY_PORT`: Redis/Valkey port
- `DB_PATH`: SQLite database path
- `AVATARS_DIR`: Avatar upload directory

## API Endpoints

### Authentication
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /me` - Get current user

### Users
- `GET /users` - Get all users (requires auth)
- `GET /users/stats` - Get user statistics (requires auth)
- `GET /users/:username` - Get user by username (requires auth)
- `POST /users` - Create new user
- `PATCH /users/:username` - Update user (requires auth, self or admin)
- `DELETE /users/:username` - Delete user (requires auth)
- `POST /users/:username/avatar` - Upload avatar (requires auth, self or admin)
- `DELETE /users/:username/avatar` - Delete avatar (requires auth, self or admin)

### Health
- `GET /` - Welcome message
- `GET /health` - Health check

## Key Differences from Express Version

1. **Decorators**: Uses NestJS decorators (@Controller, @Get, @Post, etc.)
2. **Dependency Injection**: Services are injected via constructor
3. **Guards**: Middleware converted to NestJS guards
4. **DTOs**: Input validation using class-validator decorators
5. **Module System**: Organized into feature modules
6. **TypeScript**: Full TypeScript support with type safety
7. **Testing**: Uses NestJS testing utilities

## Migration Notes

- All Express routes converted to NestJS controllers
- Middleware converted to guards and interceptors
- Helper functions moved to common/helpers
- TypeORM entity uses decorators instead of EntitySchema
- Session handling remains compatible with Express session
- All tests converted to use NestJS testing framework
