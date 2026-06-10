let audioCtx: AudioContext | null = null;

const getAudioCtx = (): AudioContext => {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }

    return audioCtx;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.12) => {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch {
        /* audio not available */
    }
};

export const sfx = {
    merge: () => {
        playTone(523, 0.12, 'sine', 0.1);
        setTimeout(() => playTone(659, 0.12, 'sine', 0.1), 60);
    },
    levelUp: () => {
        playTone(523, 0.1, 'sine', 0.1);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 80);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 160);
    },
    packOpen: () => {
        playTone(392, 0.08, 'triangle', 0.08);
        setTimeout(() => playTone(523, 0.1, 'triangle', 0.08), 50);
    },
    cardReveal: () => {
        playTone(880, 0.15, 'sine', 0.08);
        setTimeout(() => playTone(1047, 0.2, 'sine', 0.06), 100);
    },
    magicBox: () => {
        playTone(330, 0.12, 'triangle', 0.08);
        setTimeout(() => playTone(440, 0.15, 'triangle', 0.08), 80);
    },
    claim: () => {
        playTone(659, 0.1, 'sine', 0.1);
        setTimeout(() => playTone(784, 0.12, 'sine', 0.1), 70);
        setTimeout(() => playTone(988, 0.18, 'sine', 0.1), 140);
    },
    memoryMatch: () => {
        playTone(784, 0.15, 'sine', 0.1);
    },
    memoryComplete: () => {
        playTone(523, 0.1, 'sine', 0.1);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 80);
        setTimeout(() => playTone(784, 0.1, 'sine', 0.1), 160);
        setTimeout(() => playTone(1047, 0.2, 'sine', 0.12), 240);
    },
};
