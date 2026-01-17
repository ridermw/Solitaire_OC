import { useState, useEffect } from 'react';
import { getRankValue, isOppositeColor } from '../utils/cardUtils';
import { dealNewGame } from '../utils/gameLogic';
import { isGameWinnable } from '../utils/solver';
import type { Card, GameState, Suit } from '../types/game';

const INITIAL_GAME_STATE: GameState = {
  stock: [],
  waste: [],
  foundations: {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  },
  tableau: [[], [], [], [], [], [], []],
  score: 0,
};

export const useSolitaire = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [selectedCard, setSelectedCard] = useState<{ card: Card, source: string, index?: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [drawCount, setDrawCount] = useState<1 | 3>(1);
  const [autoMoveEnabled, setAutoMoveEnabled] = useState(false);
  
  // Animation state for dealing
  const [isDealing, setIsDealing] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []); // Run only on mount

  const startNewGame = async (overrideDrawCount?: 1 | 3) => {
    setIsGenerating(true);
    setIsDealing(true); // Start deal animation flag
    const count = overrideDrawCount ?? drawCount;

    // Use setTimeout to allow UI to render loading state if needed
    setTimeout(() => {
        let attempts = 0;
        let winnableGame: GameState | null = null;
        
        while (attempts < 20 && !winnableGame) { 
            const candidate = dealNewGame();
            if (isGameWinnable(candidate, count)) { // Pass draw count to solver
                winnableGame = candidate;
            }
            attempts++;
        }

        // Fallback
        if (!winnableGame) {
             console.warn("Could not find provably winnable game in attempts, dealing random.");
             winnableGame = dealNewGame();
        }

        setGameState(winnableGame);
        setSelectedCard(null);
        setIsGenerating(false);
        
        // End dealing animation after a short delay (simulating card distribution visual time)
        // In a real physics animation we would wait for callbacks, but here we just use state for now
        setTimeout(() => setIsDealing(false), 1000); 
    }, 10);
  };

  const changeDrawCount = (newCount: 1 | 3) => {
      setDrawCount(newCount);
      startNewGame(newCount);
  };

  const toggleAutoMove = () => {
      setAutoMoveEnabled(prev => !prev);
  };

  const drawCard = () => {
    if (gameState.stock.length === 0) {
      // Recycle waste to stock
      const newStock = [...gameState.waste].reverse().map(c => ({ ...c, isFaceUp: false }));
      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: [],
      }));
    } else {
      const newStock = [...gameState.stock];
      const cardsToDraw: Card[] = [];
      
      const count = Math.min(drawCount, newStock.length);
      for (let i = 0; i < count; i++) {
           const card = newStock.pop()!;
           card.isFaceUp = true;
           cardsToDraw.push(card);
      }
      
      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: [...prev.waste, ...cardsToDraw],
      }));
    }
    setSelectedCard(null);
  };

  const handleCardClick = (card: Card, source: string, index?: number) => {
    if (!card.isFaceUp && source.startsWith('tableau')) {
        return;
    }

    // If card is from stock (and facedown), ignore (drawCard handles clicks on stock pile itself)
    if (source === 'stock') return;

    if (autoMoveEnabled) {
         // Try to find a valid move immediately
         if (attemptAutoMove({ card, source, index })) {
             setSelectedCard(null); // Clear selection if moved
             return;
         }
         // If no move found, fall through to selection logic (or do nothing? User said "If there are no valid moves, it will go nowhere.")
         // "Go nowhere" implies we might not even select it? Or just that it doesn't move?
         // Usually auto-move acts as a "double click" or "smart click". If it can't move, it often selects it for manual moving.
         // Let's stick to strict interpretation: "it will go nowhere". But standard UX is to select it if it can't move.
         // Let's try to select it if it can't move, so manual move is possible.
    }

    if (!selectedCard) {
      // Select card if valid source
      if (source === 'waste' || source.startsWith('tableau') || source.startsWith('foundation')) {
         setSelectedCard({ card, source, index });
      }
    } else {
      // Attempt move
      if (selectedCard.card.id === card.id) {
        setSelectedCard(null); // Deselect
      } else {
        attemptMove(selectedCard, { source, index });
      }
    }
  };

  const attemptAutoMove = (from: { card: Card, source: string, index?: number }): boolean => {
      // Priority 1: Move to Foundation
      const suit = from.card.suit;
      const foundationPile = gameState.foundations[suit];
      const targetRankVal = foundationPile.length > 0 ? getRankValue(foundationPile[foundationPile.length - 1].rank) : 0;
      
      if (getRankValue(from.card.rank) === targetRankVal + 1) {
          executeMove(from, { source: `foundation-${suit}` });
          return true;
      }

      // Priority 2: Move to Tableau
      // Scan all tableau piles for a valid spot
      // IMPORTANT: Don't move a King from an empty tableau slot to another empty tableau slot (useless loop)
      // Check if current spot is already bottom of a tableau pile?
      const isKing = from.card.rank === 'K';
      
      for (let i = 0; i < 7; i++) {
          const pile = gameState.tableau[i];
          if (pile.length === 0) {
              if (isKing) {
                   // Only move King to empty spot if it's NOT already in an empty spot (e.g. at base of another pile)
                   // If source is tableau and index is 0, it's already at base.
                   if (from.source.startsWith('tableau') && from.index === 0) continue;
                   
                   executeMove(from, { source: `tableau-${i}` });
                   return true;
              }
          } else {
              const targetCard = pile[pile.length - 1];
              if (isOppositeColor(from.card, targetCard) && getRankValue(from.card.rank) === getRankValue(targetCard.rank) - 1) {
                  executeMove(from, { source: `tableau-${i}` });
                  return true;
              }
          }
      }

      return false;
  };

  const attemptMove = (
    from: { card: Card, source: string, index?: number },
    to: { source: string, index?: number }
  ) => {
    // Logic for moving to Foundation
    if (to.source.startsWith('foundation')) {
      const suit = to.source.split('-')[1] as Suit;
      if (from.card.suit === suit) {
        const foundationPile = gameState.foundations[suit];
        const targetRankVal = foundationPile.length > 0 ? getRankValue(foundationPile[foundationPile.length - 1].rank) : 0;
        
        if (getRankValue(from.card.rank) === targetRankVal + 1) {
             executeMove(from, to);
             return;
        }
      }
    }

    // Logic for moving to Tableau
    if (to.source.startsWith('tableau')) {
        const tableauIndex = parseInt(to.source.split('-')[1]);
        const targetPile = gameState.tableau[tableauIndex];
        
        if (targetPile.length === 0) {
            // Only King can go to empty tableau
            if (from.card.rank === 'K') {
                executeMove(from, to);
            }
        } else {
            const targetCard = targetPile[targetPile.length - 1];
            if (isOppositeColor(from.card, targetCard) && getRankValue(from.card.rank) === getRankValue(targetCard.rank) - 1) {
                executeMove(from, to);
            }
        }
    }

    setSelectedCard(null);
  };
  
  const handleEmptyTableauClick = (tableauIndex: number) => {
      // If AutoMove is on, clicking empty space doesn't make sense for "auto moving" anything *to* it
      // unless we had a card selected previously (manual mode override).
      // So standard selection logic applies.
      if (selectedCard && selectedCard.card.rank === 'K') {
          executeMove(selectedCard, { source: `tableau-${tableauIndex}` });
      }
  };

  const executeMove = (
    from: { card: Card, source: string, index?: number },
    to: { source: string, index?: number }
  ) => {
      let newGameState = { ...gameState };
      let cardsToMove: Card[] = [];

      // Remove from source
      if (from.source === 'waste') {
          newGameState.waste = newGameState.waste.slice(0, -1);
          cardsToMove = [from.card];
      } else if (from.source.startsWith('tableau')) {
          const tIndex = parseInt(from.source.split('-')[1]);
          const splitIndex = from.index!; // Must exist for tableau source
          cardsToMove = newGameState.tableau[tIndex].slice(splitIndex);
          newGameState.tableau[tIndex] = newGameState.tableau[tIndex].slice(0, splitIndex);
          
          // Flip new top card if needed
          if (newGameState.tableau[tIndex].length > 0) {
              const topCard = newGameState.tableau[tIndex][newGameState.tableau[tIndex].length - 1];
              if (!topCard.isFaceUp) {
                   // Clone to avoid mutation
                   const newTop = { ...topCard, isFaceUp: true };
                   newGameState.tableau[tIndex][newGameState.tableau[tIndex].length - 1] = newTop;
              }
          }
      } else if (from.source.startsWith('foundation')) {
          const suit = from.source.split('-')[1] as Suit;
          newGameState.foundations[suit] = newGameState.foundations[suit].slice(0, -1);
          cardsToMove = [from.card];
      }

      // Add to destination
      if (to.source.startsWith('tableau')) {
          const tIndex = parseInt(to.source.split('-')[1]);
          newGameState.tableau[tIndex] = [...newGameState.tableau[tIndex], ...cardsToMove];
      } else if (to.source.startsWith('foundation')) {
          const suit = to.source.split('-')[1] as Suit;
          // Foundations can only take one card at a time
          if (cardsToMove.length === 1) {
              newGameState.foundations[suit] = [...newGameState.foundations[suit], ...cardsToMove];
          } else {
              return; 
          }
      }

      setGameState(newGameState);
      setSelectedCard(null);
  };

  return {
    gameState,
    selectedCard,
    isGenerating,
    isDealing,
    drawCount,
    autoMoveEnabled,
    startNewGame,
    changeDrawCount,
    toggleAutoMove,
    drawCard,
    handleCardClick,
    handleEmptyTableauClick,
  };
};
