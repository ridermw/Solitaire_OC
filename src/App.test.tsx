import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import type { Card } from './types/game';
import App from './App';
import { useSolitaire } from './hooks/useSolitaire';

vi.mock('./hooks/useSolitaire', () => ({
  useSolitaire: vi.fn(),
}));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  const stripMotionProps = (props: Record<string, unknown>) => {
    const {
      layoutId,
      initial,
      animate,
      exit,
      transition,
      whileDrag,
      whileHover,
      whileTap,
      drag,
      dragSnapToOrigin,
      dragControls,
      dragElastic,
      ...rest
    } = props;

    return rest;
  };

  return {
    ...actual,
    LayoutGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    motion: {
      div: ({ children, ...rest }: { children: React.ReactNode }) => (
        <div {...stripMotionProps(rest)}>{children}</div>
      ),
      button: ({ children, ...rest }: { children: React.ReactNode }) => (
        <button {...stripMotionProps(rest)}>{children}</button>
      ),
      span: ({ children, ...rest }: { children: React.ReactNode }) => (
        <span {...stripMotionProps(rest)}>{children}</span>
      ),
    },
  };
});

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: overrides.id ?? 'card-1',
  suit: overrides.suit ?? 'hearts',
  rank: overrides.rank ?? 'A',
  isFaceUp: overrides.isFaceUp ?? true,
});

describe('App Integration', () => {
  const baseState = {
    stock: [makeCard({ id: 'stock-1', rank: '2', isFaceUp: false })],
    waste: [makeCard({ id: 'waste-1', rank: '3' })],
    foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
    tableau: [[makeCard({ id: 'tableau-1', rank: 'K' })], [], [], [], [], [], []],
    score: 0,
  };

  const setupUseSolitaire = (overrides: Partial<ReturnType<typeof useSolitaire>> = {}) => {
    (useSolitaire as ReturnType<typeof vi.fn>).mockReturnValue({
      gameState: baseState,
      selectedCard: null,
      isGenerating: false,
      isDealing: false,
      drawCount: 3,
      autoMoveEnabled: false,
      deckId: '',
      setDeckId: vi.fn(),
      loadDeckById: vi.fn(),
      startNewGame: vi.fn(),
      changeDrawCount: vi.fn(),
      toggleAutoMove: vi.fn(),
      drawCard: vi.fn(),
      handleCardClick: vi.fn(),
      handleEmptyTableauClick: vi.fn(),
      handleDragMove: vi.fn(),
      gameKey: 0,
      undo: vi.fn(),
      canUndo: false,
      isWon: false,
      isNextDeckReady: true,
      ...overrides,
    });
  };

  beforeEach(() => {
    setupUseSolitaire();
  });

  it('should render the Solitaire game header', async () => {
    await act(async () => {
      render(<App />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByText('Solitaire')).toBeDefined();
    expect(screen.getByText('New Game')).toBeDefined();
    expect(screen.getByText('Load Deck')).toBeDefined();
  });

  it('renders the app version in the footer', async () => {
    await act(async () => {
      render(<App />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByText(`v${import.meta.env.VITE_APP_VERSION}`)).toBeDefined();
  });

  it('handles draw count change confirmation', () => {
    const changeDrawCount = vi.fn();
    setupUseSolitaire({ changeDrawCount });

    render(<App />);

    fireEvent.change(screen.getByLabelText('Draw:'), { target: { value: '1' } });
    fireEvent.click(screen.getAllByText('New Game')[0]);

    expect(screen.getByText('Start New Game?')).toBeDefined();

    fireEvent.click(screen.getAllByText('New Game')[1]);
    expect(changeDrawCount).toHaveBeenCalledWith(1);
  });

  it('routes empty foundation click when a card is selected', () => {
    const handleCardClick = vi.fn();
    setupUseSolitaire({
      selectedCard: { card: makeCard({ id: 'selected' }), source: 'waste' },
      handleCardClick,
    });

    const { container } = render(<App />);
    const foundationSlot = container.querySelector('[data-drop-zone="foundation-hearts"]');
    fireEvent.click(foundationSlot as Element);

    expect(handleCardClick).toHaveBeenCalledWith(expect.any(Object), 'foundation-hearts');
  });

  it('shows win animation when game is won', () => {
    setupUseSolitaire({ isWon: true });

    render(<App />);

    expect(screen.getByText('YOU WIN!')).toBeDefined();
    fireEvent.click(screen.getByText('Play Again'));
  });
});
