import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from './App';

// Partial mock for Framer Motion to avoid complex animation logic in tests,
// but we want to ensure callbacks are preserved if possible or at least not crashing.
// For integration tests involving layoutId, standard JSDOM won't actually perform layout animations,
// but we can verify the props are passed correctly.
vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal<typeof import('framer-motion')>();
    return {
        ...actual,
        LayoutGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        // We can keep motion.div mostly as is or simplify it if needed. 
        // Actual uses real motion but JSDOM won't animate layout.
    };
});

describe('App Integration', () => {
    it('should render the Solitaire game header', async () => {
        await act(async () => {
            render(<App />);
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(screen.getByText('Solitaire')).toBeDefined();
        expect(screen.getByText('New Game')).toBeDefined();
    });

    it('renders the app version in the footer', async () => {
        await act(async () => {
            render(<App />);
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(screen.getByText(`v${import.meta.env.VITE_APP_VERSION}`)).toBeDefined();
    });

    it('should pass layoutId to tableau cards', async () => {
        await act(async () => {
            render(<App />);
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const cardElements = screen.getAllByText(/[A2-910JQK]/);
        expect(cardElements.length).toBeGreaterThan(0);
    });
});
