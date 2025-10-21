## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository with authentication, MongoDB, Redis, and Docker support.

## Features

- ✅ **Authentication System** - Local (username/password) and Google OAuth
- ✅ **MongoDB** - Database with Mongoose ODM
- ✅ **Redis** - Caching and session management
- ✅ **Docker** - Complete containerized development environment
- ✅ **Swagger/OpenAPI** - Interactive API documentation
- ✅ **TypeScript** - Fully typed codebase
- ✅ **Fastify** - High-performance web framework

## Quick Start


```bash
# Install dependencies
$ npm install

# Setup environment
$ cp .env.example .env.development

# Start services
$ docker compose up -d

# Start application
$ npm run start:dev

# Access Swagger documentation
# Open http://localhost:3000/api/docs in your browser
```

## API Documentation

Interactive Swagger/OpenAPI documentation is available at:
- **URL**: `http://localhost:3000/api/docs`
- **Features**: Test endpoints, view schemas, authenticate with JWT
- **Guide**: See [SWAGGER.md](./SWAGGER.md) for detailed documentation
