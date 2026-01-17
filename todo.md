# Repository Review TODOs

## Architecture and Code Quality

- [ ] Split `src/App.tsx` into smaller components (TopBar, StockWaste, FoundationRow, TableauRow, DrawCountModal). Why: reduces mixed concerns and improves testability and reuse.
- [ ] Replace `document.elementFromPoint` drop logic with a dedicated DnD layer or ref-based drop zone registry. Why: current DOM querying is brittle, hard to test, and inaccessible.
- [x] Extract a shared `cloneGameState` utility (used by hook and solver). Why: avoids duplicated clone logic and keeps state copying consistent.
- [x] Make deck/card updates immutable in `src/utils/gameLogic.ts` (avoid mutating `card.isFaceUp`). Why: mutation can cause subtle bugs when references are reused.
- [ ] Add typed game event definitions in `src/utils/logger.ts` and gate debug logs. Why: removes `any`, improves maintainability, reduces console noise.
- [ ] Defer audio initialization until a user gesture or add an explicit sound enable control in `src/utils/audio.ts`. Why: browsers often block AudioContext without user interaction.
- [ ] Consider moving `isGameWinnable` work to a Web Worker or adding progress UI. Why: heavy solver loops can block the UI thread.

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

## Config and Maintenance

- [ ] Align Tailwind version documentation with `package.json`. Why: repo docs and dependencies should match.
- [ ] Remove unused default Vite CSS from `src/App.css` if not needed. Why: reduce confusion and avoid unexpected styling conflicts.
