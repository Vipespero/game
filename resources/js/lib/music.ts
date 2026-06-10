const MUSIC_KEY = 'mm-music-state';

type MusicState = {
    playing: boolean;
    volume: number;
};

let audio: HTMLAudioElement | null = null;
let currentState: MusicState = { playing: false, volume: 0.4 };
let listeners: Array<(state: MusicState) => void> = [];

const loadState = (): MusicState => {
    try {
        const saved = localStorage.getItem(MUSIC_KEY);

        if (saved) {
            return JSON.parse(saved) as MusicState;
        }
    } catch {
        /* ignore */
    }

    return { playing: false, volume: 0.4 };
};

const saveState = (state: MusicState) => {
    try {
        localStorage.setItem(MUSIC_KEY, JSON.stringify(state));
    } catch {
        /* ignore */
    }
};

const notify = () => {
    listeners.forEach((listener) => listener(currentState));
};

const getAudio = (): HTMLAudioElement => {
    if (!audio) {
        audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = currentState.volume;
    }

    return audio;
};

export const music = {
    load(src: string) {
        const el = getAudio();

        el.onerror = () => {
            currentState.playing = false;
            notify();
        };

        if (el.src !== new URL(src, window.location.origin).href) {
            el.src = src;
        }

        currentState = loadState();

        if (currentState.playing) {
            el.play().catch(() => {
                currentState.playing = false;
                notify();
            });
        }

        notify();
    },

    toggle() {
        const el = getAudio();

        if (currentState.playing) {
            el.pause();
            currentState.playing = false;
        } else {
            el.play().catch(() => undefined);
            currentState.playing = true;
        }

        saveState(currentState);
        notify();
    },

    setVolume(volume: number) {
        const el = getAudio();
        el.volume = volume;
        currentState.volume = volume;
        saveState(currentState);
        notify();
    },

    getState(): MusicState {
        return currentState;
    },

    subscribe(listener: (state: MusicState) => void): () => void {
        listeners.push(listener);

        return () => {
            listeners = listeners.filter((l) => l !== listener);
        };
    },
};
