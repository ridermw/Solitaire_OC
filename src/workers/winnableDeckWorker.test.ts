import { describe, it, expect, vi } from 'vitest';

const postMessageMock = vi.fn();

vi.stubGlobal('self', {
  postMessage: postMessageMock,
  onmessage: null,
});

vi.mock('../utils/solver', () => ({
  generateWinnableDeckOrder: vi.fn(() => [0, 1, 2]),
  encodeDeckId: vi.fn(() => 'DECKID'),
}));

await import('./winnableDeckWorker');

const sendMessage = (data: { drawCount: 1 | 3 }) => {
  const handler = (globalThis.self as { onmessage: ((event: MessageEvent<typeof data>) => void) | null }).onmessage;
  if (handler) {
    handler({ data } as MessageEvent<typeof data>);
  }
};

describe('winnableDeckWorker', () => {
  it('posts progress updates and final deck id', async () => {
    sendMessage({ drawCount: 1 });

    await vi.waitFor(() => {
      expect(postMessageMock).toHaveBeenCalledWith({ deckId: null, status: 'attempt-start', attempt: 1 });
      expect(postMessageMock).toHaveBeenCalledWith({
        deckId: 'DECKID',
        status: 'attempt-end',
        attempt: 1,
        success: true,
      });
      expect(postMessageMock).toHaveBeenCalledWith({ deckId: 'DECKID' });
    });
  });
});
