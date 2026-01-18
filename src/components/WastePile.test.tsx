import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { Card } from '../types/game';
import { WastePile } from './WastePile';

import type { ReactNode } from 'react';

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
      onMouseUp={() => onDragEnd?.(new MouseEvent('mouseup'), { point: { x: 0, y: 0 } }, card)}
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

describe('WastePile', () => {
  it('returns placeholder when empty', () => {
    const { container } = render(
      <WastePile waste={[]} onCardClick={vi.fn()} onCardDragEnd={vi.fn()} />
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('relative');
  });

  it('only allows top card interactions', () => {
    const cards = [
      createCard({ id: 'one', rank: '2' }),
      createCard({ id: 'two', rank: '3' }),
      createCard({ id: 'three', rank: '4' }),
    ];

    const onCardClick = vi.fn();
    const onCardDragEnd = vi.fn();

    const { getByTestId } = render(
      <WastePile waste={cards} onCardClick={onCardClick} onCardDragEnd={onCardDragEnd} />
    );

    fireEvent.click(getByTestId('card-one'));
    expect(onCardClick).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('card-three'));
    expect(onCardClick).toHaveBeenCalledWith(cards[2]);

    fireEvent.mouseUp(getByTestId('card-three'));
    expect(onCardDragEnd).toHaveBeenCalled();
  });
});
