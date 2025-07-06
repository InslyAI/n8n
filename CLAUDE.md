# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies (uses pnpm v10.2+)
pnpm install

# Build all packages
pnpm build

# Development mode with auto-reload
pnpm dev              # Full stack (backend + frontend)
pnpm dev:be          # Backend only
pnpm dev:fe          # Frontend only

# Run tests
pnpm test            # All tests
pnpm test:backend    # Backend unit tests
pnpm test:frontend   # Frontend unit tests  
pnpm test:nodes      # Node tests
pnpm test:e2e        # E2E tests with Cypress

# Code quality checks
pnpm lint            # Run ESLint
pnpm lintfix         # Fix linting issues
pnpm format          # Format code with Biome/Prettier
pnpm format:check    # Check formatting
pnpm typecheck       # TypeScript type checking

# Run a single test file
pnpm test:backend -- packages/cli/test/unit/services/orchestration.service.test.ts
```

## Architecture Overview

n8n is a monorepo using pnpm workspaces with the following structure:

```
packages/
├── @n8n/               # Scoped shared packages (config, types, utils)
├── cli/                # Backend application (Express server, workflow execution)
├── core/               # Core workflow execution engine
├── frontend/
│   └── editor-ui/      # Vue 3 frontend application
├── nodes-base/         # Built-in node implementations
└── workflow/           # Workflow-related utilities
```

### Key Technologies
- **Backend**: TypeScript, Node.js, Express, Bull (Redis queue)
- **Frontend**: Vue 3 with Composition API, Pinia, Vite
- **Database**: SQLite (dev), PostgreSQL/MySQL (production)
- **Testing**: Jest (backend), Vitest (frontend), Cypress (E2E)

### Important Patterns

1. **Dependency Injection**: Uses `@n8n/di` with decorators
   ```typescript
   @Service()
   export class MyService {
     constructor(
       private readonly otherService: OtherService,
     ) {}
   }
   ```

2. **Node Development**: Nodes extend `INodeType` interface
   - Located in `packages/nodes-base/nodes/`
   - Each node has a `.node.ts` file and often a `.node.json` description

3. **Frontend State**: Uses Pinia stores
   - Stores in `packages/frontend/editor-ui/src/stores/`
   - Composition API preferred over Options API

4. **API Routes**: Backend routes in `packages/cli/src/`
   - Controllers use decorators for routing
   - Authentication via JWT or API keys

## Code Style

- **Indentation**: Tabs (width 2)
- **Quotes**: Single quotes for JS/TS
- **Semicolons**: Always use semicolons
- **Line width**: 100 characters
- **Vue files**: Formatted with Prettier (not Biome)
- **Import order**: Enforced by ESLint

## Common Tasks

### Adding a New Node
1. Create node file in `packages/nodes-base/nodes/[ServiceName]/`
2. Implement `INodeType` interface
3. Add to `packages/nodes-base/package.json` nodes list
4. Write tests in same directory

### Modifying Frontend
1. Components use Vue 3 Composition API
2. Use design system components from `@n8n/design-system`
3. State management via Pinia stores
4. Routing in `packages/frontend/editor-ui/src/router.ts`

### Working with Database
1. Migrations in `packages/cli/src/databases/migrations/`
2. Entities in `packages/cli/src/databases/entities/`
3. TypeORM for database operations

## Testing

- Write unit tests for all new features
- Backend tests use Jest, frontend uses Vitest
- E2E tests for critical user flows
- Test database operations with test databases
- Mock external services in tests

## Important Notes

- This is a Fair-code licensed project (not open source)
- PRs require CLA signature
- Follow existing patterns in the codebase
- Small, focused PRs are preferred
- No direct commits to main branch
- All changes must pass CI checks