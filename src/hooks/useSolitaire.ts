import { useState, useEffect } from 'react';
import { getRankValue, isOppositeColor } from '../utils/cardUtils';
import { dealNewGame } from '../utils/gameLogic';
import { isGameWinnable } from '../utils/solver';
import { logGameEvent } from '../utils/logger';
import { playCardFlipSound, playMoveSound, playShuffleSound, playWinSound } from '../utils/audio';
import { cloneGameState } from '../utils/cloneGameState';
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
  const [drawCount, setDrawCount] = useState<1 | 3>(3); // Default to 3
  const [autoMoveEnabled, setAutoMoveEnabled] = useState(true); // Default to Auto Move On
  
  // Animation state for dealing
  const [isDealing, setIsDealing] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  // Undo history stack
  const [history, setHistory] = useState<GameState[]>([]);

  // Helper to deep clone state to avoid reference mutation issues
  const cloneState = cloneGameState;

  // Helper to push current state to history before mutation
  const pushToHistory = (currentState: GameState) => {
    setHistory(prev => [...prev, cloneState(currentState)]);
  };

  const undo = () => {
      if (history.length === 0) return;
      
      const previousState = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setGameState(previousState);
      setSelectedCard(null);
      logGameEvent('Undo Performed');
  };

  const startNewGame = async (overrideDrawCount?: 1 | 3) => {
    // Reset state to empty before generating to ensure clean animation start
    // Increment game key to force fresh mount of game board components
    setGameKey(prev => prev + 1);
    
    // Clear history on new game
    setHistory([]);
    
    // Create a completely fresh empty state object
    setGameState({
        stock: [], 
        waste: [], 
        foundations: { 
            hearts: [], 
            diamonds: [], 
            clubs: [], 
            spades: [] 
        }, 
        tableau: [[],[],[],[],[],[],[]],
        score: 0
    });
    
    // Clear selection immediately to prevent ghost selections
    setSelectedCard(null);

    // Force a small delay to ensure React commits the empty state to the DOM
    // before we start the heavy generation process.
    await new Promise(resolve => setTimeout(resolve, 50));

    setIsGenerating(true);
    logGameEvent('Searching for Winnable Game', { attemptBatchSize: 10 });
    setIsDealing(true); // Start deal animation flag
    playShuffleSound();
    const count = overrideDrawCount ?? drawCount;

    const searchForWinnableGame = () => {
        const BATCH_SIZE = 10;
        let foundGame: GameState | null = null;
        
        // Try a batch of deals
        for (let i = 0; i < BATCH_SIZE; i++) {
            const candidate = dealNewGame();
            if (isGameWinnable(candidate, count)) {
                foundGame = candidate;
                break;
            }
        }

        if (foundGame) {
            logGameEvent('Game Generated', { score: foundGame.score });
            setGameState(foundGame);
            setSelectedCard(null);
            setIsGenerating(false);
            
            // End dealing animation after a short delay (simulating card distribution visual time)
            // In a real physics animation we would wait for callbacks, but here we just use state for now
            setTimeout(() => setIsDealing(false), 1000); 
        } else {
            // Keep looking in next tick
            setTimeout(searchForWinnableGame, 0);
        }
    };

    // Start search after initial UI clear delay
    setTimeout(searchForWinnableGame, 100);
  };

  useEffect(() => {
    // Initial deal
    let mounted = true;
    
    // We wrap in a small timeout to ensure it runs after mount without blocking
    // and to avoid the "synchronous setState in effect" lint error pattern if the linter is strict,
    // although startNewGame is async/has timeouts internally.
    // Actually, simply calling a function that calls setState is fine if it's async or in timeout.
    // The linter is flagging `startNewGame()` because it *might* be synchronous.
    // Let's use a flag to be safe.
    
    if (mounted) {
        startNewGame();
    }
    
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const changeDrawCount = (newCount: 1 | 3) => {
      setDrawCount(newCount);
      startNewGame(newCount);
  };

  const toggleAutoMove = () => {
      setAutoMoveEnabled(prev => !prev);
  };

  const drawCard = () => {
    pushToHistory(gameState);

    if (gameState.stock.length === 0) {
      logGameEvent('Stock Recycled', { wasWasteSize: gameState.waste.length });
      // Recycle waste to stock
      const newStock = [...gameState.waste].reverse().map(c => ({ ...c, isFaceUp: false }));
      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: [],
      }));
      playCardFlipSound();
    } else {
      const newStock = [...gameState.stock];
      const cardsToDraw: Card[] = [];
       
      const count = Math.min(drawCount, newStock.length);
      for (let i = 0; i < count; i++) {
           const card = newStock.pop()!;
           card.isFaceUp = true;
           cardsToDraw.push(card);
      }
      
      logGameEvent('Cards Drawn', { count: cardsToDraw.length, cards: cardsToDraw });

      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: [...prev.waste, ...cardsToDraw],
      }));
      playCardFlipSound();
    }
    setSelectedCard(null);
  };

  const handleCardClick = (card: Card, source: string, index?: number) => {
    if (!card.isFaceUp && source.startsWith('tableau')) {
        return;
    }

    // If card is from stock (and facedown), ignore (drawCard handles clicks on stock pile itself)
    if (source === 'stock') return;

    const isTableauSource = source.startsWith('tableau');
    const isTopTableauCard = isTableauSource
      ? index === gameState.tableau[parseInt(source.split('-')[1])].length - 1
      : true;

    if (autoMoveEnabled && isTopTableauCard) {
         // Try to find a valid move immediately
         if (attemptAutoMove({ card, source, index })) {
             setSelectedCard(null); // Clear selection if moved
             return;
         }
         // If no move found, standard UX is to select it if it can't move, so manual move is possible.
    }

    if (!selectedCard) {
      // Select card if valid source
      if (source === 'waste' || source.startsWith('tableau') || source.startsWith('foundation')) {
         logGameEvent('Card Selected', { card, source, index });
         setSelectedCard({ card, source, index });
      }
    } else {
      // Attempt move
      if (selectedCard.card.id === card.id) {
        logGameEvent('Card Deselected', { card });
        setSelectedCard(null); // Deselect
      } else {
        logGameEvent('Move Attempted (Click)', { from: selectedCard, to: { source, index } });
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
          logGameEvent('Auto Move Success (Foundation)', { card: from.card, target: `foundation-${suit}` });
          executeMove(from, { source: `foundation-${suit}` });
          return true;
      }

      // Priority 2: Move to Tableau
      const isKing = from.card.rank === 'K';
      
      for (let i = 0; i < 7; i++) {
          const pile = gameState.tableau[i];
          if (pile.length === 0) {
              if (isKing) {
                   if (from.source.startsWith('tableau') && from.index === 0) continue;
                   logGameEvent('Auto Move Success (Tableau King)', { card: from.card, target: `tableau-${i}` });
                   executeMove(from, { source: `tableau-${i}` });
                   return true;
              }
          } else {
              const targetCard = pile[pile.length - 1];
              if (isOppositeColor(from.card, targetCard) && getRankValue(from.card.rank) === getRankValue(targetCard.rank) - 1) {
                  logGameEvent('Auto Move Success (Tableau)', { card: from.card, target: `tableau-${i}` });
                  executeMove(from, { source: `tableau-${i}` });
                  return true;
              }
          }
      }
      
      logGameEvent('Auto Move Failed', { card: from.card });
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
      // For dropping on empty tableau
      if (selectedCard && selectedCard.card.rank === 'K') {
          executeMove(selectedCard, { source: `tableau-${tableauIndex}` });
      }
  };

  // Exposed method for drag and drop to execute a move directly
  const handleDragMove = (from: { card: Card, source: string, index?: number }, toSource: string) => {
       logGameEvent('Move Attempted (Drag)', { from, toSource });
       attemptMove(from, { source: toSource });
  };

  const executeMove = (
    from: { card: Card, source: string, index?: number },
    to: { source: string, index?: number }
  ) => {
      // Save current state to history before executing move
      pushToHistory(gameState);

      // Deep clone current state for the new state to prevent mutation of the state we just pushed to history
      const newGameState = cloneState(gameState);
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
              logGameEvent('Invalid Move (Multiple cards to foundation)', { cardsToMove });
              return; 
          }
      }

      logGameEvent('Move Executed', { from: from.source, to: to.source, cards: cardsToMove.map(c => c.id) });
      setGameState(newGameState);
      playMoveSound();
      setSelectedCard(null);
  };

  useEffect(() => {
    if (Object.values(gameState.foundations).every(pile => pile.length === 13)) {
        playWinSound();
    }
  }, [gameState.foundations]);

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
    handleDragMove,
    gameKey,
    undo,
    canUndo: history.length > 0,
    isWon: Object.values(gameState.foundations).every(pile => pile.length === 13)
  };
};
