# Shared Packages

This directory will contain shared packages for the monorepo.

Examples:
- `@semantius/shared-types` - Shared TypeScript types
- `@semantius/ui-components` - Shared UI components
- `@semantius/api-client` - API client library
- `@semantius/utils` - Shared utilities

## Adding a New Package

1. Create a new directory: `packages/package-name`
2. Initialize with `pnpm init`
3. Add to workspace in `pnpm-workspace.yaml` (already configured for `packages/*`)
4. Install from other packages: `pnpm add @semantius/package-name --filter @semantius/frontend`

