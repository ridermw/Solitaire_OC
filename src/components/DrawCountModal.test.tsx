import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrawCountModal } from './DrawCountModal';

describe('DrawCountModal', () => {
  it('renders nothing when no pending change', () => {
    const { container } = render(
      <DrawCountModal pendingDrawCount={null} onCancel={vi.fn()} onConfirm={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('fires cancel and confirm handlers', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(<DrawCountModal pendingDrawCount={1} onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('New Game'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
