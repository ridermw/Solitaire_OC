import type { GameState } from '../types/game';

export const cloneGameState = (state: GameState): GameState => ({
  stock: state.stock.map(card => ({ ...card })),
  waste: state.waste.map(card => ({ ...card })),
  foundations: {
    hearts: state.foundations.hearts.map(card => ({ ...card })),
    diamonds: state.foundations.diamonds.map(card => ({ ...card })),
    clubs: state.foundations.clubs.map(card => ({ ...card })),
    spades: state.foundations.spades.map(card => ({ ...card })),
  },
  tableau: state.tableau.map(pile => pile.map(card => ({ ...card }))),
  score: state.score,
});
