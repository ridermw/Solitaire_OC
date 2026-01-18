import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StockPile } from './StockPile';

describe('StockPile', () => {
  it('renders stock back and handles draw', () => {
    const onDraw = vi.fn();
    const { container } = render(<StockPile hasStock={true} onDraw={onDraw} />);

    const root = container.firstElementChild as HTMLElement;
    fireEvent.click(root);
    expect(onDraw).toHaveBeenCalledTimes(1);

    expect(container.querySelector('.bg-blue-800')).toBeInTheDocument();
  });

  it('renders reset state when empty', () => {
    const onDraw = vi.fn();
    render(<StockPile hasStock={false} onDraw={onDraw} />);

    expect(screen.getByText('↺')).toBeInTheDocument();
  });
});
