import type { DrawCount } from '../types/game';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const DECK_SIZE = 52;
// 52! requires ceil(log2(52!)) = 226 bits minimum, so we need 29 bytes (232 bits)
const DECK_CODE_BYTES = 29;

export type { DrawCount };

interface Card {
    index: number;
    value: number;
    suit: number;
    color: number;
}

interface GameState {
    foundations: number[][];
    tableau: number[][];
    // Number of face-up cards in each tableau column (counted from top of pile)
    faceUpCounts: number[];
    stock: number[];
    waste: number[];
    drawCount: DrawCount;
}

interface KlondikeSolverOptions {
    maxStates?: number;
    maxDepth?: number;
}

const encodeBase64 = (bytes: Uint8Array): string => {
    let output = '';
    for (let i = 0; i < bytes.length; i += 3) {
        const chunk = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
        const padding = i + 2 >= bytes.length ? (i + 1 >= bytes.length ? 2 : 1) : 0;

        output += BASE64_ALPHABET[(chunk >> 18) & 63];
        output += BASE64_ALPHABET[(chunk >> 12) & 63];
        output += padding >= 2 ? '=' : BASE64_ALPHABET[(chunk >> 6) & 63];
        output += padding >= 1 ? '=' : BASE64_ALPHABET[chunk & 63];
    }
    return output;
};

const decodeBase64 = (encoded: string): Uint8Array => {
    const lookup = new Map<string, number>();
    for (let i = 0; i < BASE64_ALPHABET.length; i++) {
        lookup.set(BASE64_ALPHABET[i], i);
    }

    const sanitized = encoded.replace(/\s+/g, '');
    if (sanitized.length % 4 !== 0) {
        throw new Error('Invalid base64 input: length must be a multiple of 4');
    }
    const bytes: number[] = [];

    for (let i = 0; i < sanitized.length; i += 4) {
        const chunk = sanitized.slice(i, i + 4);
        if (chunk.length < 4) {
            throw new Error('Invalid base64 input: found incomplete 4-character chunk');
        }

        const sextets = chunk.split('').map(char => lookup.get(char) ?? 0);
        const padding = chunk.endsWith('==') ? 2 : chunk.endsWith('=') ? 1 : 0;
        const combined = (sextets[0] << 18) | (sextets[1] << 12) | (sextets[2] << 6) | sextets[3];

        bytes.push((combined >> 16) & 255);
        if (padding < 2) bytes.push((combined >> 8) & 255);
        if (padding < 1) bytes.push(combined & 255);
    }

    return new Uint8Array(bytes);
};

class KlondikeSolver {
    private maxStates: number;
    private maxDepth: number;
    private visitedStates: Set<string> = new Set();

    constructor(options: KlondikeSolverOptions = {}) {
        this.maxStates = options.maxStates ?? 100000;
        this.maxDepth = options.maxDepth ?? 300;
    }

    private toCard(index: number): Card {
        const suit = Math.floor(index / 13);
        return {
            index,
            value: index % 13,
            suit,
            color: suit < 2 ? 1 : 0,
        };
    }

    private createInitialState(deck: number[], drawCount: DrawCount): GameState {
        const tableau: number[][] = [];
        const faceUpCounts: number[] = [];
        let pos = 0;

        for (let col = 0; col < 7; col++) {
            const colCards: number[] = [];
            for (let row = 0; row <= col; row++) {
                colCards.push(deck[pos++]);
            }
            tableau.push(colCards);
            // Initially only the top card of each column is face-up
            faceUpCounts.push(1);
        }

        const stock = deck.slice(pos);

        return {
            foundations: [[], [], [], []],
            tableau,
            faceUpCounts,
            stock,
            waste: [],
            drawCount,
        };
    }

    private hashState(state: GameState): string {
        const parts: string[] = [];

        const joinNumbers = (values: number[]) => values.join(',');
        parts.push(`f:${state.foundations.map(joinNumbers).join('|')}`);
        parts.push(`t:${state.tableau.map(joinNumbers).join('|')}`);
        parts.push(`u:${state.faceUpCounts.join(',')}`);
        parts.push(`s:${joinNumbers(state.stock)}`);
        parts.push(`w:${joinNumbers(state.waste)}`);
        parts.push(`d:${state.drawCount}`);

        return parts.join('||');
    }

    private isWon(state: GameState): boolean {
        return state.foundations.every(f => f.length === 13);
    }

    private getValidMoves(state: GameState): GameState[] {
        const moves: GameState[] = [];

        // Helper to handle flipping a card when face-up cards are removed
        const flipIfNeeded = (newState: GameState, colIdx: number, cardsRemoved: number) => {
            const newFaceUp = newState.faceUpCounts[colIdx] - cardsRemoved;
            if (newFaceUp <= 0 && newState.tableau[colIdx].length > 0) {
                // All face-up cards removed but there are face-down cards - flip one
                newState.faceUpCounts[colIdx] = 1;
            } else {
                newState.faceUpCounts[colIdx] = Math.max(0, newFaceUp);
            }
        };

        // Tableau to foundation (top card only, must be face-up)
        for (let colIdx = 0; colIdx < 7; colIdx++) {
            const col = state.tableau[colIdx];
            if (col.length === 0) continue;
            if (state.faceUpCounts[colIdx] === 0) continue; // No face-up cards

            const topCard = this.toCard(col[col.length - 1]);
            const foundationIdx = topCard.suit;
            const foundation = state.foundations[foundationIdx];

            if ((foundation.length === 0 && topCard.value === 0) ||
                (foundation.length > 0 && topCard.value === foundation.length)) {
                const newState = this.cloneState(state);
                newState.tableau[colIdx] = col.slice(0, -1);
                newState.foundations[foundationIdx] = [...foundation, topCard.index];
                flipIfNeeded(newState, colIdx, 1);
                moves.push(newState);
            }
        }

        // Waste to foundation
        if (state.waste.length > 0) {
            const topCard = this.toCard(state.waste[state.waste.length - 1]);
            const foundationIdx = topCard.suit;
            const foundation = state.foundations[foundationIdx];

            if ((foundation.length === 0 && topCard.value === 0) ||
                (foundation.length > 0 && topCard.value === foundation.length)) {
                const newState = this.cloneState(state);
                newState.waste = state.waste.slice(0, -1);
                newState.foundations[foundationIdx] = [...foundation, topCard.index];
                moves.push(newState);
            }
        }

        // Tableau to tableau (only face-up cards can be moved)
        for (let fromCol = 0; fromCol < 7; fromCol++) {
            const col = state.tableau[fromCol];
            if (col.length === 0) continue;
            
            const faceUpCount = state.faceUpCounts[fromCol];
            if (faceUpCount === 0) continue;
            
            // First face-up card index
            const firstFaceUpIdx = col.length - faceUpCount;

            // Only iterate over face-up cards
            for (let cardIdx = firstFaceUpIdx; cardIdx < col.length; cardIdx++) {
                const sequence = col.slice(cardIdx);
                if (!this.isValidSequence(sequence)) continue;

                const bottomCard = this.toCard(sequence[0]);
                const cardsToMove = sequence.length;

                for (let toCol = 0; toCol < 7; toCol++) {
                    if (fromCol === toCol) continue;

                    const targetCol = state.tableau[toCol];
                    const targetFaceUp = state.faceUpCounts[toCol];

                    // Can only place on face-up cards or empty column
                    if (targetCol.length === 0 && bottomCard.value === 12) {
                        const newState = this.cloneState(state);
                        newState.tableau[fromCol] = col.slice(0, cardIdx);
                        newState.tableau[toCol] = [...sequence];
                        newState.faceUpCounts[toCol] = cardsToMove;
                        flipIfNeeded(newState, fromCol, cardsToMove);
                        moves.push(newState);
                    } else if (targetCol.length > 0 && targetFaceUp > 0) {
                        const targetCard = this.toCard(targetCol[targetCol.length - 1]);
                        if (bottomCard.color !== targetCard.color &&
                            bottomCard.value === targetCard.value - 1) {
                            const newState = this.cloneState(state);
                            newState.tableau[fromCol] = col.slice(0, cardIdx);
                            newState.tableau[toCol] = [...targetCol, ...sequence];
                            newState.faceUpCounts[toCol] = targetFaceUp + cardsToMove;
                            flipIfNeeded(newState, fromCol, cardsToMove);
                            moves.push(newState);
                        }
                    }
                }
            }
        }

        // Waste to tableau
        if (state.waste.length > 0) {
            const wasteCard = this.toCard(state.waste[state.waste.length - 1]);

            for (let toCol = 0; toCol < 7; toCol++) {
                const targetCol = state.tableau[toCol];
                const targetFaceUp = state.faceUpCounts[toCol];

                if (targetCol.length === 0 && wasteCard.value === 12) {
                    const newState = this.cloneState(state);
                    newState.waste = state.waste.slice(0, -1);
                    newState.tableau[toCol] = [wasteCard.index];
                    newState.faceUpCounts[toCol] = 1;
                    moves.push(newState);
                } else if (targetCol.length > 0 && targetFaceUp > 0) {
                    const targetCard = this.toCard(targetCol[targetCol.length - 1]);
                    if (wasteCard.color !== targetCard.color &&
                        wasteCard.value === targetCard.value - 1) {
                        const newState = this.cloneState(state);
                        newState.waste = state.waste.slice(0, -1);
                        newState.tableau[toCol] = [...targetCol, wasteCard.index];
                        newState.faceUpCounts[toCol] = targetFaceUp + 1;
                        moves.push(newState);
                    }
                }
            }
        }

        // Draw from stock
        if (state.stock.length > 0) {
            const newState = this.cloneState(state);

            if (state.drawCount === 1) {
                const drawnCard = newState.stock.pop()!;
                newState.waste.push(drawnCard);
            } else {
                const toDraw = Math.min(3, newState.stock.length);
                for (let i = 0; i < toDraw; i++) {
                    newState.waste.push(newState.stock.pop()!);
                }
            }

            moves.push(newState);
        } else if (state.waste.length > 0) {
            // Recycle waste to stock
            const newState = this.cloneState(state);
            newState.stock = [...newState.waste].reverse();
            newState.waste = [];
            moves.push(newState);
        }

        return moves;
    }

    private isValidSequence(cards: number[]): boolean {
        if (cards.length === 1) return true;

        for (let i = 0; i < cards.length - 1; i++) {
            const card1 = this.toCard(cards[i]);
            const card2 = this.toCard(cards[i + 1]);

            if (card1.color === card2.color) return false;
            if (card2.value !== card1.value - 1) return false;
        }

        return true;
    }

    private cloneState(state: GameState): GameState {
        return {
            foundations: state.foundations.map(f => [...f]),
            tableau: state.tableau.map(col => [...col]),
            faceUpCounts: [...state.faceUpCounts],
            stock: [...state.stock],
            waste: [...state.waste],
            drawCount: state.drawCount,
        };
    }

    /**
     * Iterative depth-first search to solve the game.
     * Uses an explicit stack to avoid call stack overflow with deep recursion.
     */
    private solve(initialState: GameState): boolean {
        // Stack entries: [state, depth]
        const stack: Array<[GameState, number]> = [[initialState, 0]];

        while (stack.length > 0) {
            const [state, depth] = stack.pop()!;

            if (this.isWon(state)) {
                return true;
            }

            if (this.visitedStates.size >= this.maxStates || depth >= this.maxDepth) {
                continue;
            }

            const hash = this.hashState(state);
            if (this.visitedStates.has(hash)) {
                continue;
            }
            this.visitedStates.add(hash);

            const moves = this.getValidMoves(state);

            // Push moves in reverse order so first move is processed first (LIFO)
            for (let i = moves.length - 1; i >= 0; i--) {
                stack.push([moves[i], depth + 1]);
            }
        }

        return false;
    }

    isSolvable(deck: number[], drawCount: DrawCount = 1): boolean {
        this.visitedStates.clear();
        const initialState = this.createInitialState(deck, drawCount);
        return this.solve(initialState);
    }
}

class SeedableRng {
    private state: number;

    constructor(seed: number = Date.now() >>> 0) {
        // Ensure non-zero 32-bit state
        this.state = seed >>> 0 || 1;
    }

    /**
     * Returns a floating-point number in [0, 1).
     * Uses xorshift32, a simple, well-known PRNG algorithm.
     */
    next(): number {
        let x = this.state;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x >>> 0;
        return this.state / 0x100000000;
    }
}

class WinnableDeckGenerator {
    private solver: KlondikeSolver;
    private rng: SeedableRng;

    constructor(options: KlondikeSolverOptions = {}, seed?: number) {
        this.solver = new KlondikeSolver(options);
        this.rng = new SeedableRng(seed);
    }

    private shuffleDeck(): number[] {
        const deck = Array.from({ length: DECK_SIZE }, (_, i) => i);
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng.next() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    generateWinnableDeck(maxAttempts: number = 100, drawCount: DrawCount = 1): number[] | null {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const deck = this.shuffleDeck();
            if (this.solver.isSolvable(deck, drawCount)) {
                return deck;
            }
        }

        return null;
    }
}

class DeckCodec {
    private static factorials = DeckCodec.buildFactorials();
    private static byteSize = DECK_CODE_BYTES;

    static encode(deck: number[]): string {
        const index = this.permutationToIndex(deck);
        const bytes = this.bigIntToBytes(index, this.byteSize);
        return encodeBase64(bytes);
    }

    static decode(encoded: string): number[] {
        const bytes = decodeBase64(encoded);
        if (bytes.length !== this.byteSize) {
            throw new Error('Deck code is invalid.');
        }
        const index = this.bytesToBigInt(bytes);
        return this.indexToPermutation(index);
    }

    private static permutationToIndex(deck: number[]): bigint {
        const available = Array.from({ length: DECK_SIZE }, (_, i) => i);
        let index = 0n;

        for (let i = 0; i < DECK_SIZE; i++) {
            const value = deck[i];
            const rank = available.indexOf(value);
            index += BigInt(rank) * this.factorials[DECK_SIZE - 1 - i];
            available.splice(rank, 1);
        }

        return index;
    }

    private static indexToPermutation(index: bigint): number[] {
        const deck = new Array(DECK_SIZE);
        const available = Array.from({ length: DECK_SIZE }, (_, i) => i);
        let remaining = index;

        for (let i = 0; i < DECK_SIZE; i++) {
            const factorial = this.factorials[DECK_SIZE - 1 - i];
            const rankBigInt = remaining / factorial;
            if (rankBigInt < 0n || rankBigInt >= BigInt(available.length)) {
                throw new Error('Deck code is invalid.');
            }
            const rank = Number(rankBigInt);
            remaining = remaining % factorial;

            deck[i] = available[rank];
            available.splice(rank, 1);
        }

        return deck;
    }

    private static buildFactorials(): bigint[] {
        const factorials = new Array<bigint>(DECK_SIZE + 1);
        factorials[0] = 1n;
        for (let i = 1; i <= DECK_SIZE; i++) {
            factorials[i] = factorials[i - 1] * BigInt(i);
        }
        return factorials;
    }

    private static bigIntToBytes(value: bigint, size: number): Uint8Array {
        const bytes = new Uint8Array(size);
        let temp = value;

        for (let i = 0; i < size && temp > 0n; i++) {
            bytes[i] = Number(temp & 0xffn);
            temp >>= 8n;
        }

        return bytes;
    }

    private static bytesToBigInt(bytes: Uint8Array): bigint {
        let result = 0n;
        let multiplier = 1n;

        for (let i = 0; i < bytes.length; i++) {
            result += multiplier * BigInt(bytes[i]);
            multiplier <<= 8n;
        }

        return result;
    }

    static displayCard(n: number): string {
        const suits = ['H', 'D', 'C', 'S'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return values[n % 13] + suits[Math.floor(n / 13)];
    }
}

export { KlondikeSolver, WinnableDeckGenerator, DeckCodec };
