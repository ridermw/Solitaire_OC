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

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    setIsGenerating(true);
    // Use setTimeout to allow UI to render loading state if needed
    setTimeout(() => {
        let attempts = 0;
        let winnableGame: GameState | null = null;
        
        while (attempts < 20 && !winnableGame) { // Limit attempts to avoid freezing
            const candidate = dealNewGame();
            if (isGameWinnable(candidate)) {
                winnableGame = candidate;
            }
            attempts++;
        }

        // Fallback if solver fails (rare, but possible with simple heuristic)
        if (!winnableGame) {
             console.warn("Could not find provably winnable game in attempts, dealing random.");
             winnableGame = dealNewGame();
        }

        setGameState(winnableGame);
        setSelectedCard(null);
        setIsGenerating(false);
    }, 10);
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
      const card = newStock.pop()!;
      card.isFaceUp = true;
      
      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: [...prev.waste, card],
      }));
    }
    setSelectedCard(null);
  };

  const handleCardClick = (card: Card, source: string, index?: number) => {
    if (!card.isFaceUp && source.startsWith('tableau')) {
        // Only top card can be flipped if it is not face up (handled automatically by game logic usually, but here for safety)
        return;
    }

    // If card is from stock (and facedown), ignore (drawCard handles clicks on stock pile itself)
    if (source === 'stock') return;

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

    // If move invalid, just change selection to the new card (if it's a valid selection start)
    // Actually, standard UX is to deselect if invalid move, or select new card if we clicked a valid new source.
    // For simplicity, let's just deselect.
    setSelectedCard(null);
  };
  
  const handleEmptyTableauClick = (tableauIndex: number) => {
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
              // Invalid move (multiple cards to foundation) - revert removal (complex, so just return early before state update in a real app, but here we assumed valid move before calling execute)
              // For safety in this simplified logic, we just don't update if logic fails
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
    startNewGame,
    drawCard,
    handleCardClick,
    handleEmptyTableauClick,
  };
};
