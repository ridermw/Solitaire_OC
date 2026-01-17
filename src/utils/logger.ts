// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logGameEvent = (action: string, details?: any) => {
    if (import.meta.env.DEV) {
        console.groupCollapsed(`🃏 Game Event: ${action}`);
        if (details) console.log(details);
        // console.trace('Stack Trace'); // Optional: can be noisy for animation events
        console.groupEnd();
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logAnimationEvent = (element: string, phase: 'Start' | 'Complete', details?: any) => {
    if (import.meta.env.DEV) {
        console.log(`✨ Animation ${phase}: ${element}`, details);
    }
};
