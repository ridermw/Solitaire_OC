const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const DECK_SIZE = 52;
const DECK_CODE_BYTES = 28;

export type DrawCount = 1 | 3;

interface Card {
    index: number;
    value: number;
    suit: number;
    color: number;
}

interface GameState {
    foundations: number[][];
    tableau: number[][];
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
    const bytes: number[] = [];

    for (let i = 0; i < sanitized.length; i += 4) {
        const chunk = sanitized.slice(i, i + 4);
        if (chunk.length < 4) break;

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
        let pos = 0;

        for (let col = 0; col < 7; col++) {
            const colCards: number[] = [];
            for (let row = 0; row <= col; row++) {
                colCards.push(deck[pos++]);
            }
            tableau.push(colCards);
        }

        const stock = deck.slice(pos);

        return {
            foundations: [[], [], [], []],
            tableau,
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

        for (let colIdx = 0; colIdx < 7; colIdx++) {
            const col = state.tableau[colIdx];
            if (col.length === 0) continue;

            const topCard = this.toCard(col[col.length - 1]);
            const foundationIdx = topCard.suit;
            const foundation = state.foundations[foundationIdx];

            if ((foundation.length === 0 && topCard.value === 0) ||
                (foundation.length > 0 && topCard.value === foundation.length)) {
                const newState = this.cloneState(state);
                newState.tableau[colIdx] = col.slice(0, -1);
                newState.foundations[foundationIdx] = [...foundation, topCard.index];
                moves.push(newState);
            }
        }

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

        for (let fromCol = 0; fromCol < 7; fromCol++) {
            const col = state.tableau[fromCol];
            if (col.length === 0) continue;

            for (let cardIdx = 0; cardIdx < col.length; cardIdx++) {
                const sequence = col.slice(cardIdx);
                if (!this.isValidSequence(sequence)) continue;

                const bottomCard = this.toCard(sequence[0]);

                for (let toCol = 0; toCol < 7; toCol++) {
                    if (fromCol === toCol) continue;

                    const targetCol = state.tableau[toCol];

                    if (targetCol.length === 0 && bottomCard.value === 12) {
                        const newState = this.cloneState(state);
                        newState.tableau[fromCol] = col.slice(0, cardIdx);
                        newState.tableau[toCol] = [...targetCol, ...sequence];
                        moves.push(newState);
                    } else if (targetCol.length > 0) {
                        const targetCard = this.toCard(targetCol[targetCol.length - 1]);
                        if (bottomCard.color !== targetCard.color &&
                            bottomCard.value === targetCard.value - 1) {
                            const newState = this.cloneState(state);
                            newState.tableau[fromCol] = col.slice(0, cardIdx);
                            newState.tableau[toCol] = [...targetCol, ...sequence];
                            moves.push(newState);
                        }
                    }
                }
            }
        }

        if (state.waste.length > 0) {
            const wasteCard = this.toCard(state.waste[state.waste.length - 1]);

            for (let toCol = 0; toCol < 7; toCol++) {
                const targetCol = state.tableau[toCol];

                if (targetCol.length === 0 && wasteCard.value === 12) {
                    const newState = this.cloneState(state);
                    newState.waste = state.waste.slice(0, -1);
                    newState.tableau[toCol] = [...targetCol, wasteCard.index];
                    moves.push(newState);
                } else if (targetCol.length > 0) {
                    const targetCard = this.toCard(targetCol[targetCol.length - 1]);
                    if (wasteCard.color !== targetCard.color &&
                        wasteCard.value === targetCard.value - 1) {
                        const newState = this.cloneState(state);
                        newState.waste = state.waste.slice(0, -1);
                        newState.tableau[toCol] = [...targetCol, wasteCard.index];
                        moves.push(newState);
                    }
                }
            }
        }

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
            stock: [...state.stock],
            waste: [...state.waste],
            drawCount: state.drawCount,
        };
    }

    private solve(state: GameState, depth: number): boolean {
        if (this.isWon(state)) {
            return true;
        }

        if (this.visitedStates.size >= this.maxStates || depth >= this.maxDepth) {
            return false;
        }

        const hash = this.hashState(state);
        if (this.visitedStates.has(hash)) {
            return false;
        }
        this.visitedStates.add(hash);

        const moves = this.getValidMoves(state);

        for (const nextState of moves) {
            if (this.solve(nextState, depth + 1)) {
                return true;
            }
        }

        return false;
    }

    isSolvable(deck: number[], drawCount: DrawCount = 1): boolean {
        this.visitedStates.clear();
        const initialState = this.createInitialState(deck, drawCount);
        return this.solve(initialState, 0);
    }
}

class WinnableDeckGenerator {
    private solver: KlondikeSolver;

    constructor(options: KlondikeSolverOptions = {}) {
        this.solver = new KlondikeSolver(options);
    }

    private shuffleDeck(): number[] {
        const deck = Array.from({ length: DECK_SIZE }, (_, i) => i);
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
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
        let index = 0n;
        let factorial = 1n;
        const used = new Array(DECK_SIZE).fill(false);

        for (let i = DECK_SIZE - 1; i >= 0; i--) {
            let rank = 0;
            for (let j = 0; j < deck[i]; j++) {
                if (!used[j]) rank++;
            }
            used[deck[i]] = true;
            index += factorial * BigInt(rank);
            factorial *= BigInt(DECK_SIZE - i);
        }

        return index;
    }

    private static indexToPermutation(index: bigint): number[] {
        const deck = new Array(DECK_SIZE);
        const used = new Array(DECK_SIZE).fill(false);
        let remaining = index;

        for (let i = DECK_SIZE - 1; i >= 0; i--) {
            const factorial = this.factorials[DECK_SIZE - i - 1];
            const rank = Number(remaining / factorial);
            remaining %= factorial;

            let count = 0;
            for (let j = 0; j < DECK_SIZE; j++) {
                if (!used[j]) {
                    if (count === rank) {
                        deck[i] = j;
                        used[j] = true;
                        break;
                    }
                    count++;
                }
            }
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
