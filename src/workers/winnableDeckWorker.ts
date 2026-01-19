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
  status?: 'attempt-start' | 'attempt-end';
  attempt?: number;
  success?: boolean;
};

self.onmessage = async (event: MessageEvent<WinnableDeckRequest>) => {
  const { drawCount, maxAttempts = 100, maxStates = 100000, maxDepth = 300 } = event.data;
  let deckId: string | null = null;
  let attempt = 0;

  while (!deckId) {
    attempt += 1;
    self.postMessage({ deckId: null, status: 'attempt-start', attempt } satisfies WinnableDeckResponse);

    const deckOrder = generateWinnableDeckOrder(drawCount, maxAttempts, maxStates, maxDepth);
    deckId = deckOrder ? encodeDeckId(deckOrder) : null;

    if (deckId) {
      console.log('Winnable deck generated', { deckId, attempt });
      self.postMessage({ deckId, status: 'attempt-end', attempt, success: true } satisfies WinnableDeckResponse);
      break;
    }

    console.log('Winnable deck not found, retrying', { attempt });
    self.postMessage({ deckId: null, status: 'attempt-end', attempt, success: false } satisfies WinnableDeckResponse);
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  if (deckId) {
    self.postMessage({ deckId } satisfies WinnableDeckResponse);
  }
};
