import '@testing-library/jest-dom';

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
