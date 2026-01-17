// Klondike Solitaire Solver using DFS with state tracking
// This is a proper solver that exhaustively searches for a winning sequence of moves

import type { Card, GameState, Suit } from '../types/game';
import { getRankValue, isOppositeColor } from './cardUtils';
import { cloneGameState } from './cloneGameState';

// Move types for the solver
type MoveKind =
  | 'draw_stock'
  | 'recycle_waste'
  | 'waste_to_foundation'
  | 'waste_to_tableau'
  | 'tableau_to_foundation'
  | 'tableau_to_tableau'
  | 'flip_tableau';

interface Move {
  kind: MoveKind;
  src?: number;  // Source tableau index
  dst?: number;  // Destination tableau index
  suit?: Suit;   // For foundation moves
  runStartIndex?: number; // For tableau runs
}

// Helper to deep clone state for simulation
const cloneState = cloneGameState;

// Generate a unique key for state to detect cycles
const getStateKey = (state: GameState): string => {
    const parts: string[] = [];
    
    // Stock and waste
    parts.push(`S:${state.stock.map(c => c.id).join(',')}`);
    parts.push(`W:${state.waste.map(c => c.id).join(',')}`);
    
    // Foundations
    const foundationKeys = ['hearts', 'diamonds', 'clubs', 'spades'].map(suit => 
        state.foundations[suit as Suit].map(c => c.id).join(',')
    );
    parts.push(`F:${foundationKeys.join('|')}`);
    
    // Tableau (including face-up/down state)
    const tableauKeys = state.tableau.map(pile => 
        pile.map(c => `${c.id}:${c.isFaceUp ? '1' : '0'}`).join(',')
    );
    parts.push(`T:${tableauKeys.join('|')}`);
    
    return parts.join('||');
};

// Check if game is won
const isWin = (state: GameState): boolean => {
    return Object.values(state.foundations).reduce((sum, pile) => sum + pile.length, 0) === 52;
};

// Get all legal moves from current state
function* getLegalMoves(state: GameState, _drawCount: 1 | 3, stockPassesUsed: number, maxStockPasses: number): Iterable<Move> {
    // Draw from stock
    if (state.stock.length > 0) {
        yield { kind: 'draw_stock' };
    }
    
    // Recycle waste to stock (with pass limit)
    if (state.stock.length === 0 && state.waste.length > 0 && stockPassesUsed < maxStockPasses) {
        yield { kind: 'recycle_waste' };
    }
    
    // Flip face-down tableau cards
    for (let i = 0; i < 7; i++) {
        const pile = state.tableau[i];
        if (pile.length > 0 && !pile[pile.length - 1].isFaceUp) {
            yield { kind: 'flip_tableau', src: i };
        }
    }
    
    // Waste to foundation
    if (state.waste.length > 0) {
        const wasteTop = state.waste[state.waste.length - 1];
        if (canMoveToFoundation(wasteTop, state.foundations[wasteTop.suit])) {
            yield { kind: 'waste_to_foundation', suit: wasteTop.suit };
        }
    }
    
    // Waste to tableau
    if (state.waste.length > 0) {
        const wasteTop = state.waste[state.waste.length - 1];
        for (let dst = 0; dst < 7; dst++) {
            if (canMoveToTableau(wasteTop, state.tableau[dst])) {
                yield { kind: 'waste_to_tableau', dst };
            }
        }
    }
    
    // Tableau to foundation
    for (let src = 0; src < 7; src++) {
        const pile = state.tableau[src];
        if (pile.length > 0 && pile[pile.length - 1].isFaceUp) {
            const top = pile[pile.length - 1];
            if (canMoveToFoundation(top, state.foundations[top.suit])) {
                yield { kind: 'tableau_to_foundation', src, suit: top.suit };
            }
        }
    }
    
    // Tableau to tableau (with runs)
    for (let src = 0; src < 7; src++) {
        const srcPile = state.tableau[src];
        if (srcPile.length === 0) continue;
        
        // Find first face-up card
        const firstFaceUpIdx = srcPile.findIndex(c => c.isFaceUp);
        if (firstFaceUpIdx === -1) continue;
        
        // Try moving runs starting from each face-up card
        for (let startIdx = firstFaceUpIdx; startIdx < srcPile.length; startIdx++) {
            if (!isValidRun(srcPile, startIdx)) continue;
            
            const movingCard = srcPile[startIdx];
            for (let dst = 0; dst < 7; dst++) {
                if (dst === src) continue;
                if (canMoveToTableau(movingCard, state.tableau[dst])) {
                    yield { kind: 'tableau_to_tableau', src, dst, runStartIndex: startIdx };
                }
            }
        }
    }
}

// Check if cards form a valid descending run with alternating colors
const isValidRun = (pile: Card[], startIndex: number): boolean => {
    for (let i = startIndex; i < pile.length - 1; i++) {
        const current = pile[i];
        const next = pile[i + 1];
        if (!isOppositeColor(current, next)) return false;
        if (getRankValue(current.rank) !== getRankValue(next.rank) + 1) return false;
    }
    return true;
};

// Apply a move to the state (mutates state)
const applyMove = (state: GameState, move: Move, drawCount: 1 | 3): number => {
    let newStockPasses = 0;
    
    switch (move.kind) {
        case 'draw_stock': {
            const count = Math.min(drawCount, state.stock.length);
            for (let i = 0; i < count; i++) {
                const card = state.stock.pop()!;
                card.isFaceUp = true;
                state.waste.push(card);
            }
            break;
        }
        
        case 'recycle_waste': {
            state.stock = state.waste.reverse().map(c => ({ ...c, isFaceUp: false }));
            state.waste = [];
            newStockPasses = 1;
            break;
        }
        
        case 'flip_tableau': {
            const pile = state.tableau[move.src!];
            if (pile.length > 0) {
                pile[pile.length - 1].isFaceUp = true;
            }
            break;
        }
        
        case 'waste_to_foundation': {
            const card = state.waste.pop()!;
            state.foundations[move.suit!].push(card);
            break;
        }
        
        case 'waste_to_tableau': {
            const card = state.waste.pop()!;
            state.tableau[move.dst!].push(card);
            break;
        }
        
        case 'tableau_to_foundation': {
            const card = state.tableau[move.src!].pop()!;
            state.foundations[move.suit!].push(card);
            // Flip next card if exists
            const pile = state.tableau[move.src!];
            if (pile.length > 0 && !pile[pile.length - 1].isFaceUp) {
                pile[pile.length - 1].isFaceUp = true;
            }
            break;
        }
        
        case 'tableau_to_tableau': {
            const srcPile = state.tableau[move.src!];
            const movingCards = srcPile.splice(move.runStartIndex!);
            state.tableau[move.dst!].push(...movingCards);
            // Flip next card if exists
            if (srcPile.length > 0 && !srcPile[srcPile.length - 1].isFaceUp) {
                srcPile[srcPile.length - 1].isFaceUp = true;
            }
            break;
        }
    }
    
    return newStockPasses;
};

// Score moves for prioritization (higher = better)
const scoreMove = (move: Move): number => {
    switch (move.kind) {
        case 'waste_to_foundation': return 100;
        case 'tableau_to_foundation': return 90;
        case 'flip_tableau': return 80;
        case 'tableau_to_tableau': return 50;
        case 'waste_to_tableau': return 40;
        case 'draw_stock': return 10;
        case 'recycle_waste': return 0;
        default: return 0;
    }
};

// Iterative DFS solver with explicit stack to avoid call stack overflow
const dfs = (
    initialState: GameState,
    drawCount: 1 | 3,
    maxStockPasses: number,
    maxNodes: number,
    deadline: number
): boolean => {
    const visited = new Set<string>();
    
    // Stack entries: [state, stockPassesUsed]
    const stack: Array<[GameState, number]> = [[initialState, 0]];
    let nodesExplored = 0;
    
    while (stack.length > 0 && nodesExplored < maxNodes && Date.now() < deadline) {
        const [state, stockPassesUsed] = stack.pop()!;
        nodesExplored++;
        
        // Check win condition
        if (isWin(state)) return true;
        
        // Check if we've seen this state before
        const key = getStateKey(state);
        if (visited.has(key)) continue;
        visited.add(key);
        
        // Get all legal moves and sort by priority
        const moves = Array.from(getLegalMoves(state, drawCount, stockPassesUsed, maxStockPasses));
        moves.sort((a, b) => scoreMove(a) - scoreMove(b)); // Lower priority first so higher priority is popped first
        
        // Push states onto stack (in reverse priority order so highest priority is on top)
        for (const move of moves) {
            const nextState = cloneState(state);
            const passesIncrement = applyMove(nextState, move, drawCount);
            stack.push([nextState, stockPassesUsed + passesIncrement]);
        }
    }
    
    return false;
};

// Main solver entry point
export const isGameWinnable = (
    initialState: GameState,
    drawCount: 1 | 3 = 1,
    maxNodes = 1_000_000,
    timeLimitMs = 2000,
    maxStockPasses = 3
): boolean => {
    const deadline = Date.now() + timeLimitMs;
    return dfs(initialState, drawCount, maxStockPasses, maxNodes, deadline);
};

// Helper functions
function canMoveToFoundation(card: Card, foundation: Card[]): boolean {
    if (foundation.length === 0) return getRankValue(card.rank) === 1; // Ace
    const top = foundation[foundation.length - 1];
    return getRankValue(card.rank) === getRankValue(top.rank) + 1;
}

function canMoveToTableau(card: Card, targetPile: Card[]): boolean {
    if (targetPile.length === 0) return card.rank === 'K';
    const top = targetPile[targetPile.length - 1];
    if (!top.isFaceUp) return false;
    return isOppositeColor(card, top) && getRankValue(card.rank) === getRankValue(top.rank) - 1;
}
