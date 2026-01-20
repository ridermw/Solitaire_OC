# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Klondike Solitaire web application built with React 19, TypeScript, Vite, and Tailwind CSS. Features winnable deck generation using a web worker-based solver.

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Type-check (tsc -b) then build (vite build)
npm run lint         # ESLint
npm test             # Run all tests with coverage
npm run test:watch   # Run tests in watch mode
npx vitest run path/to/file.test.ts  # Run single test file
```

## Architecture

### State Management

All game state lives in `useSolitaire` hook (`src/hooks/useSolitaire.ts`). This hook:
- Manages the `GameState` (stock, waste, foundations, tableau, score)
- Handles card selection, moves, undo history
- Coordinates with the web worker for deck generation
- Exposes all game actions to components

### Winnable Deck Pipeline

The app guarantees winnable games through a background pipeline:

1. **Worker** (`src/workers/winnableDeckWorker.ts`) - Runs in background, generates winnable decks on demand
2. **Solver** (`src/utils/klondike-solver.ts`) - `KlondikeSolver` uses iterative DFS to verify winnability; `WinnableDeckGenerator` shuffles until a winnable deck is found; `DeckCodec` encodes/decodes deck permutations as base64 strings
3. **Queue** - `useSolitaire` pre-queues the next deck while user plays, tracking which draw count (1 or 3) it was generated for

Deck IDs are deterministic base64 encodings of the 52-card permutation (29 bytes → 40 chars).

### Key Types (`src/types/game.ts`)

```typescript
interface Card { id: string; suit: Suit; rank: Rank; isFaceUp: boolean; }
interface GameState { stock: Card[]; waste: Card[]; foundations: { [Suit]: Card[] }; tableau: Card[][]; score: number; }
type DrawCount = 1 | 3;
```

### Component Structure

- `App.tsx` - Root component, wires `useSolitaire` to UI
- `TopBar` - Controls (new game, undo, draw count, deck ID input)
- `GameBoard` - Layout for stock, waste, foundations, tableau
- `Card` - Individual card with drag support (Framer Motion)

### Testing

- Vitest with jsdom environment
- Setup file (`src/test/setup.ts`) mocks AudioContext, fetch, and Worker
- Tests co-located with source files (`*.test.ts`, `*.test.tsx`)

## Code Conventions

- **Imports**: Group React/external first, then internal. Use `import type { X }` for types.
- **TypeScript**: Strict mode, no `any`. Use `interface` for props/state shapes, `type` for unions.
- **State immutability**: Use spread syntax or `structuredClone` when mutating game state.
- **Files**: PascalCase for components, camelCase for hooks/utils.
- **Commits**: Conventional Commits format (e.g., `feat:`, `fix:`).

## Git Workflow

- Always create a feature branch before making changes: `git checkout -b <branch-name>`
- Branch naming: `feat/description`, `fix/description`, `refactor/description`
- Never commit directly to `main`

## Test-Driven Development

- Write unit tests for all changes
- When fixing bugs, write a failing test first that reproduces the issue, then fix the code to make it pass
- Run `npm test` before committing to ensure no regressions
