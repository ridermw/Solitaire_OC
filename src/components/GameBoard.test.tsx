import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Card, Suit } from '../types/game';
import { GameBoard } from './GameBoard';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      whileDrag,
      whileHover,
      drag,
      dragSnapToOrigin,
      dragControls,
      dragElastic,
      layoutId,
      ...rest
    }: {
      children: ReactNode
      initial?: unknown
      animate?: unknown
      exit?: unknown
      transition?: unknown
      whileDrag?: unknown
      whileHover?: unknown
      drag?: unknown
      dragSnapToOrigin?: unknown
      dragControls?: unknown
      dragElastic?: unknown
      layoutId?: string
    }) => <div {...rest}>{children}</div>,
  },
}));

vi.mock('./Card', () => ({
  Card: ({ card, onClick, onDragEnd }: { card: Card; onClick?: () => void; onDragEnd?: (...args: unknown[]) => void }) => (
    <button
      type="button"
      data-testid={`card-${card.id}`}
      onClick={onClick}
      onMouseUp={() => onDragEnd?.(new MouseEvent('mouseup'), { point: { x: 15, y: 25 } }, card)}
    >
      {card.rank}
    </button>
  ),
}));

const createCard = (overrides: Partial<Card>): Card => ({
  id: overrides.id ?? 'card-1',
  suit: overrides.suit ?? 'hearts',
  rank: overrides.rank ?? 'A',
  isFaceUp: overrides.isFaceUp ?? true,
});

const createFoundations = (overrides?: Partial<Record<Suit, Card[]>>): Record<Suit, Card[]> => ({
  hearts: [],
  diamonds: [],
  clubs: [],
  spades: [],
  ...overrides,
});

describe('GameBoard', () => {
  const originalElementFromPoint = document.elementFromPoint;

  beforeEach(() => {
    document.elementFromPoint = vi.fn();
  });

  afterEach(() => {
    document.elementFromPoint = originalElementFromPoint;
    vi.clearAllMocks();
  });

  it('wires stock, waste, and tableau interactions', () => {
    const onDrawCard = vi.fn();
    const onCardClick = vi.fn();
    const onEmptyTableauClick = vi.fn();
    const onEmptyFoundationClick = vi.fn();
    const onDragMove = vi.fn();

    const wasteCard = createCard({ id: 'waste-1', rank: '2' });
    const tableauCard = createCard({ id: 'tableau-1', rank: '3' });

    const { container } = render(
      <GameBoard
        stockCount={1}
        waste={[wasteCard]}
        foundations={createFoundations()}
        tableau={[[tableauCard], [], [], [], [], [], []]}
        selectedCardId={wasteCard.id}
        isDealing={false}
        isGenerating={false}
        onDrawCard={onDrawCard}
        onCardClick={onCardClick}
        onEmptyTableauClick={onEmptyTableauClick}
        onEmptyFoundationClick={onEmptyFoundationClick}
        onDragMove={onDragMove}
      />
    );

    const stockRoot = container.querySelector('.w-24.h-36.cursor-pointer') as HTMLElement;
    fireEvent.click(stockRoot);
    expect(onDrawCard).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('card-waste-1'));
    expect(onCardClick).toHaveBeenCalledWith(wasteCard, 'waste');

    fireEvent.click(screen.getByTestId('card-tableau-1'));
    expect(onCardClick).toHaveBeenCalledWith(tableauCard, 'tableau-0', 0);

    const emptyPlaceholder = container.querySelectorAll('.bg-green-900.bg-opacity-10')[1];
    fireEvent.click(emptyPlaceholder as Element);
    expect(onEmptyTableauClick).toHaveBeenCalled();
  });

  it('fires drag move when dropping on a target', () => {
    const onDragMove = vi.fn();
    const dragCard = createCard({ id: 'drag-1', rank: 'K' });
    const dropZone = document.createElement('div');
    dropZone.setAttribute('data-drop-zone', 'tableau-2');
    dropZone.appendChild(document.createElement('span'));

    (document.elementFromPoint as ReturnType<typeof vi.fn>).mockReturnValue(dropZone.firstChild);

    render(
      <GameBoard
        stockCount={0}
        waste={[dragCard]}
        foundations={createFoundations()}
        tableau={[[], [], [], [], [], [], []]}
        selectedCardId={dragCard.id}
        isDealing={false}
        isGenerating={false}
        onDrawCard={vi.fn()}
        onCardClick={vi.fn()}
        onEmptyTableauClick={vi.fn()}
        onEmptyFoundationClick={vi.fn()}
        onDragMove={onDragMove}
      />
    );

    const wasteCard = screen.getByTestId('card-drag-1');
    fireEvent.mouseUp(wasteCard);

    expect(onDragMove).toHaveBeenCalled();
  });

  it('allows empty foundation click', () => {
    const onEmptyFoundationClick = vi.fn();

    render(
      <GameBoard
        stockCount={0}
        waste={[]}
        foundations={createFoundations()}
        tableau={[[], [], [], [], [], [], []]}
        selectedCardId={undefined}
        isDealing={false}
        isGenerating={false}
        onDrawCard={vi.fn()}
        onCardClick={vi.fn()}
        onEmptyTableauClick={vi.fn()}
        onEmptyFoundationClick={onEmptyFoundationClick}
        onDragMove={vi.fn()}
      />
    );

    const emptySlots = screen.getAllByText((text) => ['♥', '♦', '♣', '♠'].includes(text));
    fireEvent.click(emptySlots[0].closest('div') as Element);
    expect(onEmptyFoundationClick).toHaveBeenCalledWith('hearts');
  });
});
