// Solitaire is notoriously hard to prove solvable efficiently (it's NP-complete).
// However, most "winnable" deal generators simply play the game out with a solver.
// Since a full solver is complex, we will implement a basic heuristic check or
// potentially just ensure we don't deal obviously impossible states if we can detect them easily.
//
// But a more robust approach (often used in casual games) is to try to solve it.
//
// For this iteration, let's implement a 'Solvability Checker' that attempts to play the game automatically.
// If it gets stuck, we assume it *might* be unsolvable (though our solver might just be bad).
//
// To guarantee a winnable game, we can use the "Deal backwards" or "Pre-solved" approach,
// but that creates very specific distributions.
//
// Instead, let's just generate random deals and run a quick solver on them. If the solver wins, it's 100% winnable.
// If not, we discard and retry (up to a limit).

import type { Card, GameState } from '../types/game';
import { getRankValue, isOppositeColor } from './cardUtils';

// Helper to deep clone state for simulation
const cloneState = (state: GameState): GameState => {
    return {
        stock: [...state.stock],
        waste: [...state.waste],
        foundations: {
            hearts: [...state.foundations.hearts],
            diamonds: [...state.foundations.diamonds],
            clubs: [...state.foundations.clubs],
            spades: [...state.foundations.spades],
        },
        tableau: state.tableau.map(pile => [...pile]),
        score: state.score
    };
};

const getTopCard = (pile: Card[]): Card | null => pile.length > 0 ? pile[pile.length - 1] : null;

export const isGameWinnable = (initialState: GameState, drawCount: 1 | 3 = 1, maxMoves = 1000): boolean => {
    // A simplified greedy solver
    let state = cloneState(initialState);
    let movesWithoutProgress = 0;
    const history = new Set<string>();

    // Helper to serialize state to detect cycles (simplified)
    const getStateSignature = (s: GameState) => {
        // We only care about the top cards and stock/waste counts roughly
        // This is a hash.
        return JSON.stringify({
            f: Object.values(s.foundations).map(p => p.length),
            t: s.tableau.map(p => p.map(c => c.isFaceUp ? c.id : 'X')),
            s: s.stock.length,
            w: s.waste.length > 0 ? s.waste[s.waste.length - 1].id : null,
            wc: s.waste.length // Include waste count for better accuracy
        });
    };

    for (let move = 0; move < maxMoves; move++) {
        let moved = false;
        
        // 1. Try to move to foundation (Always good?)
        // Check waste
        const wasteCard = getTopCard(state.waste);
        if (wasteCard) {
            if (canMoveToFoundation(wasteCard, state)) {
                moveCardToFoundation(wasteCard, state, 'waste');
                moved = true;
            }
        }
        // Check tableau tips
        if (!moved) {
            for (let i = 0; i < 7; i++) {
                const card = getTopCard(state.tableau[i]);
                if (card && canMoveToFoundation(card, state)) {
                     moveCardToFoundation(card, state, 'tableau', i);
                     moved = true;
                     break;
                }
            }
        }

        // 2. Try to improve tableau (reveal face down cards or move Kings)
        if (!moved) {
             // Look for moves between tableau piles
             for (let i = 0; i < 7; i++) {
                 // Source pile
                 if (state.tableau[i].length === 0) continue;
                 
                 // Try moving the whole stack starting from the first face up card
                 // Optimization: Don't move a King from an empty pile to another empty pile
                 
                 // Find first face up card
                 const pile = state.tableau[i];
                 const firstFaceUpIdx = pile.findIndex(c => c.isFaceUp);
                 if (firstFaceUpIdx === -1) continue; // Should not happen

                 const cardToMove = pile[firstFaceUpIdx];
                 
                 // Don't move King if it's already at bottom (index 0) of a pile
                 if (cardToMove.rank === 'K' && firstFaceUpIdx === 0) continue;

                 // Try to find a target
                 for (let j = 0; j < 7; j++) {
                     if (i === j) continue;
                     
                     if (canMoveToTableau(cardToMove, state.tableau[j])) {
                         // Execute move
                         const movingCards = pile.slice(firstFaceUpIdx);
                         state.tableau[i] = pile.slice(0, firstFaceUpIdx);
                         if (state.tableau[i].length > 0) {
                             state.tableau[i][state.tableau[i].length - 1].isFaceUp = true;
                         }
                         state.tableau[j] = [...state.tableau[j], ...movingCards];
                         moved = true;
                         break;
                     }
                 }
                 if (moved) break;
             }
        }
        
        // 3. Draw from stock
        if (!moved) {
            if (state.stock.length > 0) {
                // Draw logic with drawCount
                const count = Math.min(drawCount, state.stock.length);
                for (let i = 0; i < count; i++) {
                    const card = state.stock.pop()!;
                    card.isFaceUp = true;
                    state.waste.push(card);
                }
                moved = true;
            } else if (state.waste.length > 0) {
                // Recycle (only if we haven't just done this without progress)
                // In this simple solver, recycling is tricky. 
                // We'll limit recycling: if we cycled through the whole deck without moves, we're stuck.
                // For simplicity, let's treat recycling as a move but track cycles.
                
                // If we are just recycling endlessly, we lose.
                // Let's assume the loop 'maxMoves' covers this naturally if we don't make other progress.
                const newStock = state.waste.reverse().map(c => ({...c, isFaceUp: false}));
                state.stock = newStock;
                state.waste = [];
                moved = true;
            }
        }

        if (moved) {
             // Check win condition
             const totalFoundation = Object.values(state.foundations).reduce((acc, p) => acc + p.length, 0);
             if (totalFoundation === 52) return true;
             
             // Check cycle
             const sig = getStateSignature(state);
             if (history.has(sig)) {
                 // Loop detected
                 return false; 
             }
             history.add(sig);
             movesWithoutProgress = 0;
        } else {
            movesWithoutProgress++;
            if (movesWithoutProgress > 1) return false; // Stuck
        }
    }

    return false;
};

// --- Helper Logic (Duplicated/Adapted from gameUtils to be pure and standalone) ---

function canMoveToFoundation(card: Card, state: GameState): boolean {
    const pile = state.foundations[card.suit];
    const targetRank = pile.length > 0 ? getRankValue(pile[pile.length - 1].rank) : 0;
    return getRankValue(card.rank) === targetRank + 1;
}

function moveCardToFoundation(card: Card, state: GameState, source: 'waste' | 'tableau', tableauIdx?: number) {
    // Remove
    if (source === 'waste') {
        state.waste.pop();
    } else if (source === 'tableau' && tableauIdx !== undefined) {
        state.tableau[tableauIdx].pop();
        if (state.tableau[tableauIdx].length > 0) {
            state.tableau[tableauIdx][state.tableau[tableauIdx].length - 1].isFaceUp = true;
        }
    }
    // Add
    state.foundations[card.suit].push(card);
}

function canMoveToTableau(card: Card, targetPile: Card[]): boolean {
    if (targetPile.length === 0) {
        return card.rank === 'K';
    }
    const targetCard = targetPile[targetPile.length - 1];
    return isOppositeColor(card, targetCard) && getRankValue(card.rank) === getRankValue(targetCard.rank) - 1;
}
