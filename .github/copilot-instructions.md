# NestJS Starter - AI Coding Agent Instructions

## Architecture Overview

This is a **NestJS + Fastify** starter with authentication, running in Docker. Key stack:

- **Fastify** (not Express) - see `src/main.ts` for `NestFastifyApplication` setup
- **MongoDB** with Mongoose ODM and replica set (rs0) - connection in `app.module.ts`
- **Redis** for caching/sessions via BullMQ
- **JWT + Passport** for auth (Local + Google OAuth strategies)
- **Swagger/OpenAPI** at `/api/docs` (configured in `main.ts`)

All modules follow the NestJS modular pattern: `<feature>.module.ts` imports controllers, services, and exports what other modules need (e.g., `UserModule` exports `UserService` for `AuthModule`).

## Development Workflow

**Start dev environment:**

```bash
docker compose up -d      # Start MongoDB (replica set) + Redis
npm run start:dev         # Hot-reload dev server on port 3000
```

**Access Swagger:** `http://localhost:3000/api/docs` (test auth flows, see schemas)

**Change project name:** `npm run change-name <new-name>` updates all config files (package.json, docker-compose.yml, .env files) - see `scripts/README.md`

**MongoDB replica set:** Docker runs `scripts/mongo-init.sh` on first start to configure rs0 (required for transactions). Database is `nest-db`, credentials in `.env`.

## Code Conventions

**Authentication patterns:**

- Use `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth('JWT-auth')` for protected endpoints (see `user.controller.ts:55-56`)
- Extract user with `@CurrentUser()` decorator (returns `UserDocument` from JWT payload)
- Auth strategies in `src/auth/strategies/`: `local.strategy.ts` (username/password), `jwt.strategy.ts`, `google.strategy.ts`

**Module structure (example `auth` and `user`):**

```
src/<feature>/
  <feature>.module.ts          # Wire controllers, services, imports
  controllers/                 # HTTP layer (Swagger decorators, DTOs)
  services/                    # Business logic
  dto/                         # class-validator DTOs for validation
  guards/                      # Passport guards (local-auth, jwt-auth, google-auth)
  strategies/                  # Passport strategies
  decorators/                  # Custom decorators (e.g., current-user.decorator.ts)
  schemas/                     # Mongoose schemas (@Schema decorator)
```

**Validation & Swagger:**

- All endpoints use `class-validator` DTOs (global `ValidationPipe` in `main.ts` with `whitelist: true`, `transform: true`)
- Swagger responses: use `@ApiResponse` with `schema.example` objects (see `local-auth.controller.ts:32-46`)
- Swagger tags: `@ApiTags('auth')` or `@ApiTags('users')`

**Database patterns:**

- Mongoose schemas use `@Schema({ timestamps: true })` for `createdAt`/`updatedAt` (see `user.schema.ts`)
- Indexes defined via `UserSchema.index({ username: 1 })`
- Export `<Name>Document` type for type safety (e.g., `UserDocument = User & Document`)

**Global configuration:**

- `ConfigModule.forRoot({ isGlobal: true })` in `app.module.ts` makes env vars accessible everywhere
- Use `ConfigService.getOrThrow()` for required env vars (MongoDB connection example in `app.module.ts:19-28`)

**API versioning & prefix:**

- Global prefix: `api` (all routes start with `/api`)
- Versioning: URI-based, default `VERSION_NEUTRAL` (`main.ts:20-23`)

**CLS (Continuation Local Storage):**

- `nestjs-cls` configured globally in `app.module.ts` for request-scoped context
- Commented example shows storing `userId` from header (`app.module.ts:31-37`)

## Key Files

- `src/main.ts` - Bootstrap, Fastify config, Swagger setup, global pipes/prefix
- `src/app.module.ts` - Root module with MongoDB, Redis, CLS, and feature modules
- `src/auth/auth.module.ts` - JWT + Passport strategies registration
- `src/user/schemas/user.schema.ts` - User model (username unique, googleId optional)
- `docker-compose.yml` - Services: mongo (replica set), redis (with password), nest-app
- `.env` - MongoDB uses `MONGODB_URI` (includes replicaSet=rs0), Redis uses `REDIS_PASSWORD`

## Important Notes

- **Fastify not Express:** Use Fastify-specific syntax (e.g., `@fastify/helmet`, `FastifyAdapter`)
- **MongoDB replica set:** Connection string must include `replicaSet=rs0` (see `.env`)
- **Password hashing:** Uses `bcrypt` (see auth service imports)
- **BullMQ ready:** `@nestjs/bullmq` installed but not configured - add queue modules as needed
- **Helmet security:** Registered in `main.ts:18` via `@fastify/helmet`
- **CORS enabled:** `app.enableCors()` in `main.ts:29` (configure `CORS_ORIGIN` in `.env`)

## Testing

- Unit tests: `npm test` (jest config in `package.json`)
- E2E tests: `npm run test:e2e` (config in `test/jest-e2e.json`)
- Coverage: `npm run test:cov`

## When Adding Features

1. Generate module: `nest g module <name>` (or manually follow `user/` structure)
2. Add to `app.module.ts` imports
3. Export services if other modules need them (like `UserModule` exports `UserService`)
4. Use DTOs with `class-validator` decorators for all inputs
5. Add Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiTags`)
6. For auth-protected routes: `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth('JWT-auth')`
