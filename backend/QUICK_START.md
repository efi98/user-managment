# Quick Start Guide - NestJS Backend

## Prerequisites
- Node.js 18+ or 20+
- pnpm (or npm/yarn)

## Installation

1. **Install dependencies:**
   ```bash
   cd backend-nest
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   # Copy the example env file (already done)
   # Edit .env if needed
   ```

3. **Seed the database (optional):**
   ```bash
   pnpm run seed
   ```

## Running the Application

### Development Mode (with hot reload)
```bash
pnpm run start:dev
```

Server will start on http://localhost:1000

### Production Mode
```bash
# Build the application
pnpm run build

# Start production server
pnpm run start:prod
```

### Debug Mode
```bash
pnpm run start:debug
```

## Testing

### Run all tests
```bash
pnpm test
```

### Run tests with coverage
```bash
pnpm run test:cov
```

### Run tests in watch mode
```bash
pnpm run test:watch
```

## API Endpoints

Base URL: `http://localhost:1000`

### Authentication
- **POST** `/login` - Login user
- **POST** `/logout` - Logout user
- **GET** `/me` - Get current user (requires auth)

### Users
- **GET** `/users` - List all users (requires auth)
- **GET** `/users/stats` - Get user statistics (requires auth)
- **GET** `/users/:username` - Get specific user (requires auth)
- **POST** `/users` - Create new user (public)
- **PATCH** `/users/:username` - Update user (requires auth, self or admin)
- **DELETE** `/users/:username` - Delete user (requires auth)
- **POST** `/users/:username/avatar` - Upload avatar (requires auth, self or admin)
- **DELETE** `/users/:username/avatar` - Delete avatar (requires auth, self or admin)

### Health
- **GET** `/` - Welcome message
- **GET** `/health` - Health check

## Example Requests

### Create a User
```bash
curl -X POST http://localhost:1000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "pass1234",
    "displayName": "John Doe",
    "age": 25,
    "gender": "male"
  }'
```

### Login
```bash
curl -X POST http://localhost:1000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "pass1234"
  }' \
  --cookie-jar cookies.txt
```

### Get Current User
```bash
curl -X GET http://localhost:1000/me \
  --cookie cookies.txt
```

### Upload Avatar
```bash
curl -X POST http://localhost:1000/users/john/avatar \
  -F "avatar=@/path/to/image.jpg" \
  --cookie cookies.txt
```

## Environment Variables

Key environment variables (see `.env` file):

- `PORT` - Server port (default: 1000)
- `NODE_ENV` - Environment (development/production/test)
- `COOKIE_NAME` - Session cookie name
- `SESSION_SECRET` - Secret for session encryption
- `USE_REDIS_SESSION` - Enable Redis (true/false)
- `VALKEY_HOST` - Redis/Valkey host
- `VALKEY_PORT` - Redis/Valkey port
- `DB_PATH` - SQLite database path
- `AVATARS_DIR` - Avatar upload directory

## Project Structure

```
backend-nest/
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # Users module
│   ├── common/            # Shared guards, helpers
│   ├── types/             # TypeScript type definitions
│   ├── app.module.ts      # Main application module
│   ├── app.controller.ts  # Root controller
│   └── main.ts            # Application entry point
├── test/                  # Tests
├── scripts/               # Utility scripts
├── assets/                # Database & uploads
└── package.json
```

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t user-management-nest .

# Run container
docker run -p 1000:1000 \
  -e SESSION_SECRET=your-secret \
  -v $(pwd)/assets:/app/assets \
  user-management-nest
```

## Troubleshooting

### Port already in use
```bash
# Change PORT in .env file
PORT=3000
```

### Database locked
```bash
# Stop all instances of the app
# Delete assets/userdb.sqlite
# Run seed script again
pnpm run seed
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

## Development Tips

1. **Hot Reload**: Changes to `.ts` files automatically reload the server
2. **Debugging**: Use `pnpm run start:debug` and attach VS Code debugger
3. **Linting**: Run `pnpm run format` to format code
4. **Testing**: Write tests in `test/` directory with `.spec.ts` extension

## Next Steps

- Read `README.md` for detailed documentation
- Read `CONVERSION_SUMMARY.md` for conversion details
- Check the frontend integration guide
- Add Swagger documentation (optional)
- Setup CI/CD pipeline
- Configure production database

## Support

For issues or questions:
1. Check the README.md
2. Review CONVERSION_SUMMARY.md
3. Check NestJS documentation: https://docs.nestjs.com
