# PTIT Library

React 19 + TypeScript + Vite + Tailwind CSS v4 application.

## Development

- Install dependencies using the project's package manager and lockfile.
- Run the development server with the dev script in package.json.
- The default port is 8443; PORT can override it.
- Build with the build script; preview production output with the preview script.

## Project structure

- src/main.tsx mounts src/App.tsx and imports src/index.css.
- src/App.tsx selects the application portal using hash routing.
- src/hooks contains routing hooks.
- src/layouts contains Reader and Staff/Admin portals and the workspace sidebar.
- src/pages contains auth, Reader, Staff and shared workspace pages.
- src/components contains shared UI compositions.
- src/design-system.tsx contains reusable UI controls.
- src/data, src/constants, src/types and src/utils contain shared supporting code.
- vite.config.ts configures React, Tailwind CSS v4 and the @ alias for src.

## Styling

Keep CSS imports first in src/index.css. Tailwind CSS v4 uses @tailwindcss/vite;
no Tailwind or PostCSS configuration file is required.
Preserve existing JSX, class names and responsive behavior during structural refactors.

## Code quality

- Preserve existing behavior unless a functional change is explicitly requested.
- Use double quotes for strings containing apostrophes, or escape them.
- Close JSX tags and balance braces.
- Export components as default exports.
- Validate changes with TypeScript, the production build and git diff --check.
