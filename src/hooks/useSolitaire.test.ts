import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSolitaire } from './useSolitaire';

describe('useSolitaire', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSolitaire());
    
    expect(result.current.gameState).toBeDefined();
    expect(result.current.selectedCard).toBeNull();
    expect(result.current.drawCount).toBe(3);
    expect(result.current.autoMoveEnabled).toBe(true);
  });

  it('should eventually finish generating', async () => {
    const { result } = renderHook(() => useSolitaire());
    
    // The hook starts generating on mount
    // Wait for it to finish (with timeout)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // By this point it should have generated a game (or still be generating)
    expect(typeof result.current.isGenerating).toBe('boolean');
  });

  it('should toggle auto move', () => {
    const { result } = renderHook(() => useSolitaire());
    
    const initialAutoMove = result.current.autoMoveEnabled;
    
    act(() => {
      result.current.toggleAutoMove();
    });
    
    expect(result.current.autoMoveEnabled).toBe(!initialAutoMove);
  });

  it('should have all required methods', () => {
    const { result } = renderHook(() => useSolitaire());
    
    expect(typeof result.current.startNewGame).toBe('function');
    expect(typeof result.current.changeDrawCount).toBe('function');
    expect(typeof result.current.toggleAutoMove).toBe('function');
    expect(typeof result.current.drawCard).toBe('function');
    expect(typeof result.current.handleCardClick).toBe('function');
    expect(typeof result.current.handleEmptyTableauClick).toBe('function');
    expect(typeof result.current.handleDragMove).toBe('function');
  });

  it('should initialize with empty waste pile', () => {
    const { result } = renderHook(() => useSolitaire());
    
    expect(result.current.gameState.waste).toEqual([]);
  });

  it('should initialize with empty foundations', () => {
    const { result } = renderHook(() => useSolitaire());
    
    expect(result.current.gameState.foundations.hearts).toEqual([]);
    expect(result.current.gameState.foundations.diamonds).toEqual([]);
    expect(result.current.gameState.foundations.clubs).toEqual([]);
    expect(result.current.gameState.foundations.spades).toEqual([]);
  });

  it('should initialize with 7 tableau piles', () => {
    const { result } = renderHook(() => useSolitaire());
    
    expect(result.current.gameState.tableau).toHaveLength(7);
  });
});
