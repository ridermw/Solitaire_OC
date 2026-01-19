import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSolitaire } from './useSolitaire';
import { cloneGameState } from '../utils/cloneGameState';
import type { Card, GameState, Rank, Suit } from '../types/game';

vi.mock('../utils/audio', () => ({
  playCardFlipSound: vi.fn(),
  playMoveSound: vi.fn(),
  playWinSound: vi.fn(),
  playShuffleSound: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  logGameEvent: vi.fn(),
}));

let dealState: GameState;

const solverMocks = vi.hoisted(() => ({
  decodeDeckId: vi.fn(() => Array.from({ length: 52 }, (_, index) => index) as number[]),
  encodeDeckId: vi.fn(() => 'TESTCODE'),
  generateWinnableDeckOrder: vi.fn(() => Array.from({ length: 52 }, (_, index) => index) as number[]),
}));

vi.mock('../utils/gameLogic', () => ({
  dealGameFromDeckOrder: vi.fn(() => cloneGameState(dealState)),
}));

vi.mock('../utils/solver', () => ({
  generateWinnableDeckOrder: solverMocks.generateWinnableDeckOrder,
  encodeDeckId: solverMocks.encodeDeckId,
  decodeDeckId: solverMocks.decodeDeckId,
}));

type HookResult = { current: ReturnType<typeof useSolitaire> | null };
type HookCondition = (state: ReturnType<typeof useSolitaire>) => boolean;

const makeCard = (rank: Rank, suit: Suit, isFaceUp = false, idSuffix = ''): Card => ({
  id: `${rank}-${suit}${idSuffix}`,
  suit,
  rank,
  isFaceUp,
});

const baseStateFactory = (): GameState => ({
  stock: [
    makeCard('A', 'hearts'),
    makeCard('2', 'hearts'),
    makeCard('3', 'hearts'),
    makeCard('4', 'hearts'),
    makeCard('5', 'hearts'),
    makeCard('6', 'hearts'),
    makeCard('7', 'hearts'),
    makeCard('8', 'hearts'),
    makeCard('9', 'hearts'),
    makeCard('10', 'hearts'),
  ],
  waste: [],
  foundations: {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  },
  tableau: [[], [], [], [], [], [], []],
  score: 0,
});

const setDealState = (state: GameState) => {
  dealState = cloneGameState(state);
};

const waitForGeneration = async (result: HookResult, condition?: HookCondition) => {
  await act(async () => {
    for (let i = 0; i < 40; i += 1) {
      if (result.current && !result.current.isGenerating && (!condition || condition(result.current))) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  });
};

const waitForDeckReady = async (result: HookResult) => {
  await act(async () => {
    for (let i = 0; i < 40; i += 1) {
      if (result.current?.isNextDeckReady) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  });
};

describe('useSolitaire', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should initialize with default state', async () => {
    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForGeneration(result);

    expect(result.current.gameState).toBeDefined();
    expect(result.current.selectedCard).toBeNull();
    expect(result.current.drawCount).toBe(3);
    expect(result.current.autoMoveEnabled).toBe(true);
  });

  it('should eventually finish generating', async () => {
    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForGeneration(result);

    expect(result.current.isGenerating).toBe(false);
  });

  it('should toggle auto move', async () => {
    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForGeneration(result);

    const initialAutoMove = result.current.autoMoveEnabled;

    act(() => {
      result.current.toggleAutoMove();
    });

    expect(result.current.autoMoveEnabled).toBe(!initialAutoMove);
  });

  it('should have all required methods', async () => {
    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForGeneration(result);

    expect(typeof result.current.startNewGame).toBe('function');
    expect(typeof result.current.changeDrawCount).toBe('function');
    expect(typeof result.current.toggleAutoMove).toBe('function');
    expect(typeof result.current.drawCard).toBe('function');
    expect(typeof result.current.handleCardClick).toBe('function');
    expect(typeof result.current.handleEmptyTableauClick).toBe('function');
    expect(typeof result.current.handleDragMove).toBe('function');
    expect(typeof result.current.loadDeckById).toBe('function');
    expect(typeof result.current.isNextDeckReady).toBe('boolean');
  });

  it('loads a deck by id', async () => {
    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForGeneration(result);

    act(() => {
      result.current.setDeckId('TESTCODE');
    });

    act(() => {
      result.current.loadDeckById();
    });

    expect(result.current.deckId).toBe('TESTCODE');
  });

  it('handles invalid deck id', async () => {
    solverMocks.decodeDeckId.mockImplementationOnce(() => {
      throw new Error('bad id');
    });

    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForGeneration(result);

    act(() => {
      result.current.setDeckId('BADID');
    });

    act(() => {
      result.current.loadDeckById();
    });

    expect(result.current.deckId).toBe('BADID');
  });

  it('should initialize with empty waste pile', async () => {
    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForGeneration(result);

    expect(result.current.gameState.waste).toEqual([]);
  });

  it('should initialize with empty foundations', async () => {
    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForGeneration(result);

    expect(result.current.gameState.foundations.hearts).toEqual([]);
    expect(result.current.gameState.foundations.diamonds).toEqual([]);
    expect(result.current.gameState.foundations.clubs).toEqual([]);
    expect(result.current.gameState.foundations.spades).toEqual([]);
  });

  it('should increment gameKey when starting a new game', async () => {
    setDealState(baseStateFactory());
    const { result } = renderHook(() => useSolitaire());

    await waitForDeckReady(result);

    const initialKey = result.current.gameKey;

    await act(async () => {
      result.current.startNewGame();
    });

    expect(result.current.gameKey).toBeGreaterThan(initialKey);
  });

  it('should undo last move', async () => {
    const base = baseStateFactory();
    base.stock = [];
    base.tableau[0] = [makeCard('K', 'spades', true, '-0')];

    setDealState(base);
    const { result } = renderHook(() => useSolitaire());

    await waitForDeckReady(result);
    await waitForGeneration(result, state => state.gameState.tableau[0].length === 1);

    act(() => {
      result.current.toggleAutoMove();
    });

    const initialState = cloneGameState(result.current.gameState);

    act(() => {
      const card = result.current.gameState.tableau[0][0];
      result.current.handleCardClick(card, 'tableau-0', 0);
    });

    act(() => {
      result.current.handleEmptyTableauClick(1);
    });

    expect(result.current.gameState.tableau[1].length).toBe(1);
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.gameState).toEqual(initialState);
    expect(result.current.canUndo).toBe(false);
  });

  it('should support n-level undo', async () => {
    const base = baseStateFactory();
    base.stock = [];
    base.tableau[0] = [makeCard('K', 'spades', true, '-0')];

    setDealState(base);
    const { result } = renderHook(() => useSolitaire());

    await waitForDeckReady(result);
    await waitForGeneration(result, state => state.gameState.tableau[0].length === 1);

    act(() => {
      result.current.toggleAutoMove();
    });

    const state0 = cloneGameState(result.current.gameState);

    act(() => {
      const card = result.current.gameState.tableau[0][0];
      result.current.handleCardClick(card, 'tableau-0', 0);
    });

    act(() => {
      result.current.handleEmptyTableauClick(1);
    });

    const state1 = cloneGameState(result.current.gameState);

    act(() => {
      const card = result.current.gameState.tableau[1][0];
      result.current.handleCardClick(card, 'tableau-1', 0);
    });

    act(() => {
      result.current.handleEmptyTableauClick(2);
    });

    const state2 = cloneGameState(result.current.gameState);

    expect(state1.tableau[1].length).toBe(1);
    expect(state2.tableau[2].length).toBe(1);

    act(() => {
      result.current.undo();
    });
    expect(result.current.gameState).toEqual(state1);

    act(() => {
      result.current.undo();
    });
    expect(result.current.gameState).toEqual(state0);
  });

  it('should select a tableau run and move it together', async () => {
    const base = baseStateFactory();
    base.stock = [];
    base.tableau[0] = [
      makeCard('K', 'spades', true, '-0'),
      makeCard('Q', 'hearts', true, '-0'),
      makeCard('J', 'clubs', true, '-0'),
    ];
    base.tableau[2] = [makeCard('K', 'clubs', true, '-2')];

    setDealState(base);
    const { result } = renderHook(() => useSolitaire());

    await waitForDeckReady(result);
    await waitForGeneration(result, state => state.gameState.tableau[0].length > 1);

    const selectedCard = result.current.gameState.tableau[0][1];

    act(() => {
      result.current.handleCardClick(selectedCard, 'tableau-0', 1);
    });

    act(() => {
      const targetCard = result.current.gameState.tableau[2][0];
      result.current.handleCardClick(targetCard, 'tableau-2', 0);
    });

    expect(result.current.gameState.tableau[0].length).toBe(1);
    expect(result.current.gameState.tableau[2].map(card => card.rank)).toEqual(['K', 'Q', 'J']);
  });
});
