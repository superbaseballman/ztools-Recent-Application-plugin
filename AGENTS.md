# Agent Guidelines for my-first-plugin

This is a ZTools plugin project using React 19 + TypeScript + Vite.

## Project Overview

- **Type**: ZTools Desktop Plugin (React webapp)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Target**: Desktop plugin system with `window.ztools` and `window.services` APIs

## Build / Development Commands

```bash
# Start development server (hot reload)
npm run dev

# Production build (runs tsc then vite build)
npm run build
```

**Note**: No test framework is configured. Do not add tests unless explicitly requested.

## Code Style Guidelines

### General Rules

- Use functional components with arrow function syntax
- Use TypeScript but note that `strict` and `noImplicitAny` are disabled in tsconfig
- Prefer `any` over strict typing when dealing with plugin APIs (e.g., `enterAction: any`)
- No linting tool is configured

### File Organization

- Each feature lives in its own directory under `src/` (e.g., `src/Hello/`, `src/Read/`)
- Entry file must be `index.tsx` inside the feature directory
- Co-locate CSS in `index.css` alongside the component
- Default export the component from `index.tsx`

### Imports

Order imports as follows:
1. React/framework imports (`react`, `react-dom`)
2. Third-party library imports
3. Local component imports (`./Component`)
4. Style imports (`./index.css` or `./style.css`)

```typescript
import { useState, useEffect } from 'react'
import SomeLib from 'some-lib'
import Hello from './Hello'
import './index.css'
```

### Naming Conventions

- **Components**: PascalCase (e.g., `Hello`, `ReadFile`)
- **Files**: camelCase for `.ts`/`.tsx`, kebab-case for CSS (e.g., `index.tsx`, `main.css`)
- **Directories**: kebab-case (e.g., `src/Read/`)
- **Interfaces**: PascalCase with `Props` suffix (e.g., `ReadProps`)
- **Variables/functions**: camelCase

### TypeScript Guidelines

- Define props interfaces explicitly:
  ```typescript
  interface HelloProps {
    enterAction: any
  }
  ```
- Use `any` freely for plugin API types (they are untyped)
- Catch errors with `err: any` pattern:
  ```typescript
  } catch (err: any) {
    setError(err.message)
  }
  ```

### React Patterns

- Use hooks (`useState`, `useEffect`) for all state/logic
- Destructure props in function parameters
- Prefer early returns for conditional rendering
- Use null returns for "no render" cases

### CSS

- Co-locate CSS files: `src/FeatureName/index.css`
- Use simple className selectors
- Avoid CSS-in-JS or preprocessors

### Error Handling

- Use try/catch blocks for file operations and service calls
- Display errors to users via plugin notification API:
  ```typescript
  window.ztools.showNotification('Error message')
  ```
- Clear error state when retrying operations

### Plugin API Usage

The plugin exposes two main globals:

- **`window.ztools`**: Plugin host API
  - `window.ztools.onPluginEnter(callback)` - Listen for plugin entry
  - `window.ztools.onPluginOut(callback)` - Listen for plugin exit
  - `window.ztools.showNotification(msg)` - Show notification
  - `window.ztools.shellShowItemInFolder(path)` - Show in explorer
  - `window.ztools.outPlugin()` - Exit plugin
  - `window.ztools.showOpenDialog(options)` - Open file dialog

- **`window.services`**: File system services
  - `window.services.readFile(path)` - Read file content
  - `window.services.writeTextFile(content)` - Write text file
  - `window.services.writeImageFile(content)` - Write image file

## Project Structure

```
my-first-plugin/
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Main router component
│   ├── main.css           # Global styles
│   ├── Hello/             # Hello feature module
│   │   ├── index.tsx
│   │   └── index.css
│   ├── Read/              # Read file feature
│   │   ├── index.tsx
│   │   └── index.css
│   └── Write/             # Write file feature
│       ├── index.tsx
│       └── index.css
├── public/
│   ├── plugin.json        # Plugin manifest
│   ├── preload/           # Preload scripts
│   └── logo.png
├── package.json
├── tsconfig.json
├── vite.config.js
└── index.html
```

## Common Tasks

### Adding a New Feature

1. Create directory under `src/` (e.g., `src/NewFeature/`)
2. Create `index.tsx` with default exported component
3. Add component and route in `App.tsx`

### Accessing Plugin APIs

Always type plugin params as `any`:

```typescript
export default function MyFeature({ enterAction }: { enterAction: any }) {
  // access enterAction.type, enterAction.payload, etc.
}
```

### Debugging

- Use `console.log` for debugging (devTools available)
- Check `enterAction` via `JSON.stringify(enterAction, undefined, 2)` to see structure
