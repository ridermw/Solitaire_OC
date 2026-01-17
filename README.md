# Solitaire (Klondike)

A modern, responsive web implementation of the classic Klondike Solitaire card game, built with React, TypeScript, and Tailwind CSS.

![Solitaire Preview](https://placehold.co/800x400/35654d/white?text=Solitaire+Preview)

## 🎮 Features

- **Classic Rules:** Full implementation of Klondike Solitaire logic.
- **Responsive Design:** Works on desktop and mobile devices.
- **Modern Tech Stack:** Built with the latest React 19, TypeScript, and Vite.
- **Beautiful UI:** Felt-green aesthetic using Tailwind CSS.
- **No Assets:** All card visuals are CSS and Unicode-based (lightweight).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:5173`.

## 🛠️ Build & Test

- **Build for production:**
    ```bash
    npm run build
    ```
    This runs TypeScript type checking (`tsc -b`) followed by Vite's build process.

- **Linting:**
    ```bash
    npm run lint
    ```

## 📂 Project Structure

- `src/components`: UI components (e.g., `Card.tsx`).
- `src/hooks`: Game logic and state management (`useSolitaire.ts`).
- `src/types`: TypeScript interfaces (`Card`, `GameState`).
- `src/utils`: Helper functions (`cardUtils.ts`).

## 🧩 Tech Stack

- **Framework:** [React](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## 📝 License

MIT
