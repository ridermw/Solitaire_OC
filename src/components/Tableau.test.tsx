import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Card } from '../types/game';
import { Tableau } from './Tableau';

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
      onMouseUp={() => onDragEnd?.(new MouseEvent('mouseup'), { point: { x: 10, y: 20 } }, card)}
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

describe('Tableau', () => {
  it('renders empty placeholders and handles empty clicks', () => {
    const onEmptyClick = vi.fn();
    const { container } = render(
      <Tableau
        piles={[[], [], [], [], [], [], []]}
        selectedCardId={undefined}
        isDealing={false}
        onCardClick={vi.fn()}
        onCardDragEnd={vi.fn()}
        onEmptyClick={onEmptyClick}
      />
    );

    const placeholders = container.querySelectorAll('.bg-green-900.bg-opacity-10');
    expect(placeholders).toHaveLength(7);

    fireEvent.click(placeholders[0]);
    expect(onEmptyClick).toHaveBeenCalledWith(0);
  });

  it('renders cards and triggers click/drag handlers', () => {
    const piles = [
      [createCard({ id: 'card-1', rank: '2' }), createCard({ id: 'card-2', rank: '3' })],
      [],
      [],
      [],
      [],
      [],
      [],
    ];
    const onCardClick = vi.fn();
    const onCardDragEnd = vi.fn();

    render(
      <Tableau
        piles={piles}
        selectedCardId={piles[0][1].id}
        isDealing={true}
        onCardClick={onCardClick}
        onCardDragEnd={onCardDragEnd}
        onEmptyClick={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('card-card-1'));
    expect(onCardClick).toHaveBeenCalledWith(piles[0][0], 0, 0);

    fireEvent.mouseUp(screen.getByTestId('card-card-1'));
    expect(onCardDragEnd).toHaveBeenCalled();
  });
});
