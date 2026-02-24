# Semantius UI Frontend

This is the main React SPA application for Semantius UI.

## Structure

This application is part of a pnpm workspace monorepo. All commands should be run from the root directory using pnpm.

## Development

From the root directory:

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```

## Configuration

- Environment variables: `.env` (see `.env.example` for template)
- Vite configuration: `vite.config.ts`
- TypeScript configuration: `tsconfig.json`
- shadcn/ui configuration: `components.json`

## OAuth Configuration

Run `pnpm genconfig` from the root directory to configure OAuth settings interactively.

## See Also

- Root README.md - General project documentation
- AGENTS.md - Instructions for AI coding agents
- TESTING-API.md - API testing documentation
