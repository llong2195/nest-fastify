# GitHub Copilot Instructions

## Project Overview

This project is a backend API built with **NestJS 11** and **Fastify**. It uses a robust architecture with **TypeORM** (PostgreSQL) for data persistence and **BullMQ** (Redis) for background jobs. The codebase follows strict TypeScript standards.

## Tech Stack

- **Framework**: NestJS 11 (Fastify adapter)
- **Database**: PostgreSQL (via TypeORM)
- **Queue**: Redis + BullMQ
- **Language**: TypeScript 5.9

## Coding Standards

- **Imports**: ALWAYS use path aliases `@/*` (e.g., `import { User } from '@/modules/users/entities/user.entity';`). DO NOT use relative paths like `../../`.
- **Naming**:
  - Classes: PascalCase (e.g., `UserService`)
  - Variables/Functions: camelCase (e.g., `findUserById`)
  - Interface/Types: PascalCase
- **Type Safety**: strict mode is enabled. AVOID `any`. Explicitly type function returns.

## Key Conventions

- **Services**:
  - MUST extend `BaseService` for standard CRUD operations.
  - Example: `export class UserService extends BaseService<UserEntity, Repository<UserEntity>>`
- **Controllers**:
  - All endpoints MUST return `Promise<BaseResponseDto<T>>`.
  - Use `@ApiTags` for Swagger documentation grouping.
  - API Versioning: Use `@Controller({ version: '1', path: '...' })`.
- **Entities**:
  - Define entities in `src/database/pg/entities`.
  - Use TypeORM decorators (`@Entity`, `@Column`, etc.).
- **DTOs**:
  - Use `class-validator` decorators for all input validation (e.g., `@IsString()`, `@IsOptional()`).
- **Error Handling**:
  - Use `LoggerService` for logging. DO NOT use `console.log`.

## File Structure

- `src/modules/*`: Domain-specific modules (Controllers, Services, Providers).
- `src/common/*`: Shared utilities, decorators, filters, and base classes.
- `src/database/*`: Database configuration, migrations, and entities.

## Code Style

- Prefer `const` over `let`
- Async/await for all database operations
- Use `LoggerService` instead of `console.log`
- Strict type checking (avoid `any`)
- Use `ConfigService` for environment variables
