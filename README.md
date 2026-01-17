# Solitaire (Klondike)

A modern, responsive Klondike Solitaire game built with React, TypeScript, and Tailwind CSS.

![Solitaire Preview](https://placehold.co/800x400/35654d/white?text=Solitaire+Preview)

## Features

- Classic Klondike rules with full move validation.
- Undo support for stepping back through moves.
- Win celebration overlay with animated confetti.
- Synthesized sound effects for shuffle, flip, move, and win.
- Felt-green table UI with CSS-only card visuals.
- Responsive layout for desktop and mobile.

## How to Play

- Click the stock to draw cards to the waste.
- Click a face-up card to select it, then click a destination to move.
- Drag and drop face-up cards onto valid piles.
- Use the Auto Move toggle to send cards to foundations automatically.
- Use Undo to revert the last move.
- Changing the draw count starts a new winnable game.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## Scripts

- Build for production:
  ```bash
  npm run build
  ```
- Run tests:
  ```bash
  npm test
  ```
- Lint the project:
  ```bash
  npm run lint
  ```

## Project Structure

- `src/components`: UI components (visual presentation).
- `src/hooks`: Game logic and state management.
- `src/types`: TypeScript interfaces (`Card`, `GameState`).
- `src/utils`: Pure helpers for rules, logging, and audio.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Vitest

## License

MIT
