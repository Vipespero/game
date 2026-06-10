const MUSIC_KEY = 'mm-music-state';

type MusicState = {
    playing: boolean;
    volume: number;
    currentTrack: string;
};

const TRACKS = [
    '/music/track-01.mp3',
    '/music/track-02.mp3',
    '/music/track-03.mp3',
    '/music/track-04.mp3',
    '/music/track-05.mp3',
    '/music/track-06.mp3',
    '/music/track-07.mp3',
    '/music/track-08.mp3',
    '/music/track-09.mp3',
    '/music/track-10.mp3',
];

let audio: HTMLAudioElement | null = null;
let currentState: MusicState = { playing: false, volume: 0.35, currentTrack: '' };
let listeners: Array<(state: MusicState) => void> = [];
let availableTracks: string[] = [];

const loadState = (): MusicState => {
    try {
        const saved = localStorage.getItem(MUSIC_KEY);

        if (saved) {
            return JSON.parse(saved) as MusicState;
        }
    } catch {
        /* ignore */
    }

    return { playing: false, volume: 0.35, currentTrack: '' };
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

const pickRandomTrack = (): string => {
    if (availableTracks.length === 0) {
        return '';
    }

    const candidates = availableTracks.filter((t) => t !== currentState.currentTrack);
    const pool = candidates.length > 0 ? candidates : availableTracks;

    return pool[Math.floor(Math.random() * pool.length)] ?? '';
};

const playTrack = (track: string) => {
    if (!audio || !track) {
        return;
    }

    currentState.currentTrack = track;
    audio.src = track;

    if (currentState.playing) {
        audio.play().catch(() => undefined);
    }

    notify();
};

const onTrackEnd = () => {
    const next = pickRandomTrack();

    if (next) {
        playTrack(next);
    }
};

const getAudio = (): HTMLAudioElement => {
    if (!audio) {
        audio = new Audio();
        audio.loop = false;
        audio.preload = 'auto';
        audio.volume = currentState.volume;
        audio.addEventListener('ended', onTrackEnd);
    }

    return audio;
};

const probeTracks = async (): Promise<void> => {
    const found: string[] = [];

    for (const track of TRACKS) {
        try {
            const response = await fetch(track, { method: 'HEAD' });

            if (response.ok) {
                found.push(track);
            }
        } catch {
            /* skip */
        }
    }

    availableTracks = found;
};

export const music = {
    async init() {
        getAudio();
        currentState = loadState();
        await probeTracks();

        if (availableTracks.length > 0) {
            const track = currentState.currentTrack && availableTracks.includes(currentState.currentTrack)
                ? currentState.currentTrack
                : pickRandomTrack();

            currentState.currentTrack = track;

            if (track) {
                audio!.src = track;
            }

            if (currentState.playing && track) {
                audio!.play().catch(() => {
                    currentState.playing = false;
                    notify();
                });
            }
        }

        notify();
    },

    toggle() {
        const el = getAudio();

        if (currentState.playing) {
            el.pause();
            currentState.playing = false;
        } else {
            if (!currentState.currentTrack && availableTracks.length > 0) {
                currentState.currentTrack = pickRandomTrack();
                el.src = currentState.currentTrack;
            }

            el.play().catch(() => undefined);
            currentState.playing = true;
        }

        saveState(currentState);
        notify();
    },

    next() {
        if (availableTracks.length <= 1) {
            return;
        }

        const next = pickRandomTrack();

        if (next) {
            playTrack(next);
            saveState(currentState);
        }
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

    hasTracks(): boolean {
        return availableTracks.length > 0;
    },

    subscribe(listener: (state: MusicState) => void): () => void {
        listeners.push(listener);

        return () => {
            listeners = listeners.filter((l) => l !== listener);
        };
    },
};
