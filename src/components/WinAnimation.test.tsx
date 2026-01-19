import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WinAnimation } from './WinAnimation';

vi.mock('framer-motion', () => {
  const stripMotionProps = (props: Record<string, unknown>) => {
    const { whileHover, whileTap, initial, animate, transition, ...rest } = props;
    return rest;
  };

  return {
    motion: {
      div: ({ children, ...rest }: { children: React.ReactNode }) => (
        <div {...stripMotionProps(rest)}>{children}</div>
      ),
      button: ({ children, ...rest }: { children: React.ReactNode }) => (
        <button {...stripMotionProps(rest)}>{children}</button>
      ),
    },
  };
});

describe('WinAnimation', () => {
  it('renders win message and triggers restart', () => {
    const onRestart = vi.fn();
    render(<WinAnimation onRestart={onRestart} />);

    expect(screen.getByText('YOU WIN!')).toBeDefined();
    fireEvent.click(screen.getByText('Play Again'));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
