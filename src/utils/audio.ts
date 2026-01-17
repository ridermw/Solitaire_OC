// Audio context singleton to reuse across plays
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

// Simple synthesized sound effects
// We use synthesis to avoid needing external assets, keeping the project self-contained

export const playCardFlipSound = () => {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // "Flip" sound: quick high frequency slide
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.warn("Audio play failed", e);
    }
};

export const playMoveSound = () => {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // "Thwip" sound: quick noise-like burst (approximated with triangle wave slide)
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
        console.warn("Audio play failed", e);
    }
};

export const playWinSound = () => {
    try {
        const ctx = getAudioContext();
        
        // Play a simple major arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
        notes.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            const startTime = ctx.currentTime + (i * 0.1);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
    } catch (e) {
        console.warn("Audio play failed", e);
    }
};

export const playShuffleSound = () => {
    try {
        const ctx = getAudioContext();
        // Rapid fire soft ticks
        for(let i=0; i<10; i++) {
             const oscillator = ctx.createOscillator();
             const gainNode = ctx.createGain();
             oscillator.connect(gainNode);
             gainNode.connect(ctx.destination);
             
             const startTime = ctx.currentTime + (i * 0.03);
             
             oscillator.frequency.setValueAtTime(100 + Math.random()*50, startTime);
             gainNode.gain.setValueAtTime(0.05, startTime);
             gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.02);
             
             oscillator.start(startTime);
             oscillator.stop(startTime + 0.02);
        }
    } catch (e) {
        console.warn("Audio play failed", e);
    }
};
