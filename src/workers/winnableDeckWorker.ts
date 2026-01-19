import { encodeDeckId, generateWinnableDeckOrder } from '../utils/solver';
import type { DrawCount } from '../utils/klondike-solver';

type WinnableDeckRequest = {
  drawCount: DrawCount;
  maxAttempts?: number;
  maxStates?: number;
  maxDepth?: number;
};

type WinnableDeckResponse = {
  deckId: string | null;
  drawCount: DrawCount;
  status?: 'attempt-start' | 'attempt-end';
  attempt?: number;
  success?: boolean;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff: 50ms, 100ms, 200ms, 400ms, ... capped at 2s
const getBackoffDelay = (attempt: number): number => {
  const baseDelay = 50;
  const maxDelay = 2000;
  return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
};

self.onmessage = async (event: MessageEvent<WinnableDeckRequest>) => {
  const { drawCount, maxAttempts = 100, maxStates = 100000, maxDepth = 300 } = event.data;
  let deckId: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    self.postMessage({ deckId: null, drawCount, status: 'attempt-start', attempt } satisfies WinnableDeckResponse);

    const deckOrder = generateWinnableDeckOrder(drawCount, maxAttempts, maxStates, maxDepth);
    deckId = deckOrder ? encodeDeckId(deckOrder) : null;

    if (deckId) {
      console.log('Winnable deck generated', { deckId, attempt });
      self.postMessage({ deckId, drawCount, status: 'attempt-end', attempt, success: true } satisfies WinnableDeckResponse);
      break;
    }

    console.log('Winnable deck not found, retrying', { attempt });
    self.postMessage({ deckId: null, drawCount, status: 'attempt-end', attempt, success: false } satisfies WinnableDeckResponse);
    
    // Exponential backoff before next attempt to prevent CPU thrashing
    if (attempt < maxAttempts) {
      await sleep(getBackoffDelay(attempt));
    }
  }

  // Always send final message - either with deckId or null if all attempts exhausted
  self.postMessage({ deckId, drawCount } satisfies WinnableDeckResponse);
  
  if (!deckId) {
    console.error('Failed to generate winnable deck after max attempts', { maxAttempts });
  }
};
