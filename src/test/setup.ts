import '@testing-library/jest-dom';
import { vi } from 'vitest';

class MockAudioContext {
  createBuffer() {
    return {} as AudioBuffer;
  }

  createBufferSource() {
    return {
      buffer: null as AudioBuffer | null,
      connect: () => undefined,
      start: () => undefined,
    } as unknown as AudioBufferSourceNode;
  }

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: () => undefined,
        exponentialRampToValueAtTime: () => undefined,
      },
      connect: () => undefined,
    } as unknown as GainNode;
  }

  createOscillator() {
    return {
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
      frequency: { value: 440, setValueAtTime: () => undefined },
      type: 'sine',
    } as unknown as OscillatorNode;
  }

  decodeAudioData() {
    return Promise.resolve({} as AudioBuffer);
  }

  get destination() {
    return {} as AudioDestinationNode;
  }
}

globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;

const initialDeckId = 'YgTeTWlD0ouYaz0Pdva1TWtEvDm2ycsFlYIBAA==';

globalThis.fetch = vi.fn(async () => ({
  json: async () => [initialDeckId],
})) as unknown as typeof fetch;

class MockWorker {
  onmessage: ((event: MessageEvent<{ deckId: string | null }>) => void) | null = null;

  postMessage() {
    setTimeout(() => {
      this.onmessage?.({ data: { deckId: initialDeckId } } as MessageEvent<{ deckId: string | null }>);
    }, 0);
  }

  terminate() {
    return undefined;
  }
}

globalThis.Worker = MockWorker as unknown as typeof Worker;
