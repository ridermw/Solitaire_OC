import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('triggers toggles and actions', () => {
    const toggleAutoMove = vi.fn();
    const onDrawCountChange = vi.fn();
    const startNewGame = vi.fn();
    const undo = vi.fn();

    render(
      <TopBar
        autoMoveEnabled={true}
        toggleAutoMove={toggleAutoMove}
        drawCount={3}
        isGenerating={false}
        onDrawCountChange={onDrawCountChange}
        startNewGame={startNewGame}
        undo={undo}
        canUndo={true}
      />
    );

    fireEvent.click(screen.getByText('Auto Move'));
    expect(toggleAutoMove).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Draw:'), { target: { value: '1' } });
    expect(onDrawCountChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText('New Game'));
    expect(startNewGame).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Undo'));
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('disables controls while generating', () => {
    render(
      <TopBar
        autoMoveEnabled={false}
        toggleAutoMove={vi.fn()}
        drawCount={1}
        isGenerating={true}
        onDrawCountChange={vi.fn()}
        startNewGame={vi.fn()}
        undo={vi.fn()}
        canUndo={false}
      />
    );

    expect(screen.getByLabelText('Draw:')).toBeDisabled();
    expect(screen.getByText('Dealing...')).toBeDisabled();
    expect(screen.getByText('Undo')).toBeDisabled();
  });
});
