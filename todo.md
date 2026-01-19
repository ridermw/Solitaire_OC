# Repository Review TODOs

## Bugs (from PR #1 review)

- [x] Fix: Error state leaves game unplayable after `loadDeckById` fails (`src/hooks/useSolitaire.ts:106-110`). When `startGameWithDeckId` catches an error, game state is empty with no recovery. Fix: restore previous state, show error message, or auto-trigger new game.
- [x] Fix: Web worker infinite loop if `generateWinnableDeckOrder` always returns null (`src/workers/winnableDeckWorker.ts:23-39`). The `while (!deckId)` loop runs forever if solver fails. Fix: add max attempt limit (e.g., 10 outer attempts) or timeout.
- [x] Fix: Race condition in initial deck loading (`src/hooks/useSolitaire.ts:137-139`). `drawCount` captured at mount; changing before initial load uses stale value. Fix: use ref or re-read current state.
- [x] Fix: `deckId` state not cleared on decode error (`src/hooks/useSolitaire.ts:100, 106-110`). Invalid deck ID remains in input after failure. Fix: clear or revert `deckId` on error.
- [x] Fix: Indentation inconsistency in `App.tsx` (`src/App.tsx:62-80`). `<GameBoard>` has extra leading spaces vs other JSX.

## Gameplay and Interaction

- [ ] Ensure dragged cards render above tableau stacks (z-index/portal). Why: dragged card currently appears behind stacked cards.
- [ ] Support multi-card drag from fanned tableau piles. Why: move sequences together (e.g., 4 hearts + 3 clubs).
- [ ] Allow dragging cards from foundations back to tableau (no automove from foundation). Why: enables correcting moves without auto-return.
- [ ] Auto-move chain to foundations when a card lands there and reveals a new valid move. Why: speeds up endgame cleanup.
- [ ] Make win confetti cover the full screen. Why: currently only renders in the bottom-right area.
- [x] Add deck ID generation and UI field (base-62, 8x5-char groups with hyphens; 38 chars data + 2 checksum) tied to New Game and Load Deck. Why: enable replayable shuffles via reference id.
- [x] Gate New Game behind async winnable-deck generation (precompute next winnable deck while playing). Why: ensure only solvable games are served without blocking UI.

## Architecture and Code Quality

- [x] Split `src/App.tsx` into smaller components (TopBar, StockWaste, FoundationRow, TableauRow, DrawCountModal). Why: reduces mixed concerns and improves testability and reuse.
- [ ] Replace `document.elementFromPoint` drop logic with a dedicated DnD layer or ref-based drop zone registry. Why: current DOM querying is brittle, hard to test, and inaccessible.
- [x] Extract a shared `cloneGameState` utility (used by hook and solver). Why: avoids duplicated clone logic and keeps state copying consistent.
- [x] Make deck/card updates immutable in `src/utils/gameLogic.ts` (avoid mutating `card.isFaceUp`). Why: mutation can cause subtle bugs when references are reused.
- [ ] Add typed game event definitions in `src/utils/logger.ts` and gate debug logs. Why: removes `any`, improves maintainability, reduces console noise.
- [ ] Defer audio initialization until a user gesture or add an explicit sound enable control in `src/utils/audio.ts`. Why: browsers often block AudioContext without user interaction.
- [x] Consider moving `isGameWinnable` work to a Web Worker or adding progress UI. Why: heavy solver loops can block the UI thread.
- [x] Ensure solver calls only run in a worker process. Why: solver operations can be slow and should not block the UI thread.

## UX and Accessibility

- [ ] Add keyboard support and semantic buttons for clickable areas (stock, tableau, foundations). Why: improves accessibility and keyboard navigation.
- [ ] Make the draw-change modal a real dialog with focus trap and `aria-modal`. Why: prevents background interaction and improves screen reader behavior.
- [ ] Replace fixed card sizing with responsive sizing or CSS variables. Why: improves layout on small screens.
- [ ] Update `WinAnimation` to react to viewport changes or use relative sizing for particles. Why: current particle positions are static after mount.

## Testing

- [ ] Mock `dealNewGame` and `isGameWinnable` in `src/hooks/useSolitaire.test.ts`. Why: removes long waits and flakiness from solver-based generation.
- [ ] Re-enable skipped undo tests in `src/hooks/useSolitaire.test.ts` after mocking or stabilizing generation. Why: coverage for undo behavior is currently disabled.
- [x] Fix `src/components/Card.test.tsx` assertions to match actual class usage. Why: tests should reflect real rendering classes or use semantic queries.
- [ ] Add integration tests for draw, move, auto-move, and undo in `src/App.test.tsx`. Why: core interactions are not covered today.
- [ ] Silence AudioContext warning in `src/App.test.tsx` by mocking audio or gating audio init. Why: tests emit noisy console warnings.
- [ ] Add `drawCard` success test (stock → waste) with correct count for drawCount=3. Why: core draw interaction not covered.
- [ ] Add `drawCard` success test for drawCount=1. Why: verify draw count affects number of cards drawn.
- [ ] Add `drawCard` recycle test (stock empty, waste → stock). Why: recycle path is untested.
- [ ] Add `drawCard` blocked when `isGenerating` is true. Why: ensure blocked draw logs and does nothing.
- [ ] Add `drawCard` blocked when stock+waste empty. Why: empty pile click should be logged and no-op.
- [ ] Add `drawCard` blocked when “no cards drawn” (invalid stock contents). Why: regression coverage for no-op case.
- [ ] Add logging assertions for draw events (`Draw Clicked`, `Draw Blocked`, `Cards Drawn`). Why: logging is now required even for no-ops.
- [ ] Add auto-move to foundation test (top tableau card). Why: auto-move foundation behavior untested.
- [ ] Add auto-move to tableau test (top card). Why: auto-move tableau behavior untested.
- [ ] Add auto-move from non-top card moving full run. Why: requested behavior not covered.
- [ ] Add auto-move rejection for invalid run (color/rank mismatch). Why: ensures run validation.
- [ ] Add auto-move rejection when run includes face-down card. Why: should not move through hidden cards.
- [ ] Add “autoMoveEnabled = false” test to ensure no auto-move is attempted. Why: toggle should be respected.
- [ ] Add stock pile disabled UI test when generating or no draw possible. Why: UI disable logic changed recently.
- [ ] Add `isNextDeckReady` gating behavior test in UI (New Game disabled/enabled). Why: interaction tied to worker readiness.

## Config and Maintenance

- [ ] Align Tailwind version documentation with `package.json`. Why: repo docs and dependencies should match.
- [ ] Remove unused default Vite CSS from `src/App.css` if not needed. Why: reduce confusion and avoid unexpected styling conflicts.
- [ ] Add semantic versioning policy and update `package.json` for every commit/PR. Why: ensure releases are tracked and UI shows current version.
- [ ] Bump `package.json` on every commit pushed to main: `0.1.<commit count>` (e.g., 19 commits -> 0.1.19). Why: keep UI version aligned with repo history.
