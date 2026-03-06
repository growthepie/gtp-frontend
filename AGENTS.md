# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js App Router frontend for growthepie.
- `app/`: route groups, pages, layouts, and API routes (`app/api/*`).
- `components/`: reusable UI and feature components (charts, layout, quick-bites, sidebar).
- `lib/`: domain logic, API clients, metadata, chart utilities, and build scripts.
- `hooks/`, `contexts/`, `utils/`, `types/`: shared React hooks, context providers, helpers, and TypeScript types.
- `public/` and `icons/`: static assets and icon sources.

Example route locations: `app/(layout)/applications/page.tsx`, `app/api/notifications/route.ts`.

## Build, Test, and Development Commands
Use Node `>=22` and Yarn 1 (`yarn.lock` is source of truth).
- `yarn dev`: run local dev server with Turbo + HTTPS.
- `yarn dev:local`: run dev server on `local.growthepie.com`.
- `yarn build`: create production build (runs `postbuild` sitemap generation).
- `yarn start`: serve the production build.
- `yarn lint`: run ESLint across the repo.
- `yarn icons:update`: pull/update icon assets from Figma (`.env.local` required).

## Coding Style & Naming Conventions
- Language: TypeScript + React (Next.js 16 App Router).
- Formatting: Prettier (`tabWidth: 2`, semicolons, double quotes, trailing commas).
- Linting: `next/core-web-vitals` via ESLint.
- Components/files: `PascalCase` for React component files (e.g., `MetricChart.tsx`).
- Hooks: `useCamelCase` (e.g., `useSearchParamState.ts`).
- Helpers/utilities/types: `camelCase` or descriptive domain names.
- Use `@/*` imports for project-root aliases where helpful.

## Testing Guidelines
There is currently no dedicated automated test suite configured (no `test` script).  
Before opening a PR:
- run `yarn lint`
- run `yarn build`
- manually verify impacted routes/components in `yarn dev`

If adding tests, prefer colocated `*.test.ts(x)` files and keep fixtures minimal.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit messages, often with optional scope tags:
- `[treemap] update styles`
- `Tooltip fix`
- `[fix build error]`

PRs should include:
- clear summary of user-visible and technical changes
- linked issue/task (if available)
- screenshots or short recordings for UI changes
- notes on env/config changes and manual verification steps
