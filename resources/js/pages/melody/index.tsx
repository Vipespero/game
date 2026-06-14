import { Head, router } from '@inertiajs/react';
import {
    Album,
    Battery,
    Brain,
    ChevronLeft,
    ChevronRight,
    Crown,
    Gift,
    Heart,
    LogOut,
    Mail,
    Music,
    PackageOpen,
    RotateCcw,
    Scissors,
    Settings,
    SkipForward,
    Sparkles,
    Trophy,
    Wand2,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import type { CSSProperties, PointerEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    boardSize,
    fallbackGameConfig,
    fallbackGameRules,
    fallbackMissions,
    fallbackGamePacks,
    fallbackDuplicateHeartRewards,
    fallbackMergeItems,
    fallbackPlayerLevels,
    mergeChain,
    getAssetImage,
    getCardImage,
    getLevel,
    pieceStyle,
    chooseCard,
    getDailyMessage,
    getSplashMessage,
} from '@/lib/game-constants';
import { music } from '@/lib/music';
import { sfx } from '@/lib/sounds';
import type {
    BoardItem,
    CardRarity,
    CollagePhoto,
    CollagePieceReward,
    MelodyCard,
    MergeItemDefinition,
    CardRarityDefinition,
    GameConfig,
    GameRules,
    GamePackDefinition,
    MissionDefinition,
    PlayerLevelDefinition,
    MelodyTab,
    PackReward,
    PackCardResult,
    SavedPackReward,
    MemoryCard,
    MelodyGameSave,
    MelodyMergePageProps,
} from '@/types/game';
import logoUrl from '../../assets/logo.png?url';
import packImageUrl from '../../assets/sanrio_pack.png?url';

const makeItem = (level = 1): BoardItem => ({
    id: nanoid(),
    level,
});

const emptyBoard = (): Array<BoardItem | null> => Array.from({ length: boardSize }, () => null);

const defaultBoard = () => {
    const next = emptyBoard();
    next[8] = makeItem(1);
    next[14] = makeItem(1);
    next[21] = makeItem(2);

    return next;
};

const normalizeBoard = (board?: Array<BoardItem | null>) => {
    if (!Array.isArray(board) || board.length !== boardSize) {
        return defaultBoard();
    }

    return board.map((cell) => {
        if (!cell || typeof cell.level !== 'number') {
            return null;
        }

        return {
            id: cell.id || nanoid(),
            level: Math.min(Math.max(1, Math.round(cell.level)), mergeChain.length),
        };
    });
};

const normalizePacks = (cardsById: Map<string, MelodyCard>, packs?: SavedPackReward[]) => {
    if (!Array.isArray(packs)) {
        return [];
    }

    return packs.map((pack) => ({
        id: pack.id || nanoid(),
        label: pack.label || 'Sobre guardado',
        cards: Array.isArray(pack.cards)
            ? pack.cards.map((cardId) => cardsById.get(cardId)).filter(Boolean) as MelodyCard[]
            : [],
    })).filter((pack) => pack.cards.length > 0);
};

const normalizeTab = (tab?: string) => {
    return tab === 'album' || tab === 'room' || tab === 'memory' || tab === 'merge' ? tab : 'merge';
};

const shuffle = <T,>(items: T[]) => {
    const next = [...items];

    for (let index = next.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [next[index], next[target]] = [next[target], next[index]];
    }

    return next;
};

const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const collageColumns = 4;
const collageRowCount = 4;

const normalizeCollagePieces = (pieces?: string[]) => {
    if (!Array.isArray(pieces)) {
        return [];
    }

    return [...new Set(pieces)].filter((piece) => /^[1-9][0-9]*:(0[0-9]|1[0-5])$/.test(piece));
};

const collagePieceId = (photoId: number, pieceIndex: number) => `${photoId}:${String(pieceIndex).padStart(2, '0')}`;

const STREAK_KEY = 'mm-daily-streak';

const readStreak = (): { count: number; lastDate: string } => {
    try {
        const saved = localStorage.getItem(STREAK_KEY);

        if (saved) return JSON.parse(saved) as { count: number; lastDate: string };
    } catch { /* ignore */ }

    return { count: 0, lastDate: '' };
};

const updateStreak = (): number => {
    const streak = readStreak();
    const today = dateKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (streak.lastDate === today) {
        return streak.count;
    }

    const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1;

    try { localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today })); } catch { /* ignore */ }

    return newCount;
};

const loveLetterMessages = [
    'Queria recordarte que eres la persona mas especial del mundo para mi. Cada dia a tu lado es un regalo.',
    'No importa lo dificil que sea el dia, saber que te tengo a ti me hace todo mas llevadero.',
    'Me encanta como te ries, como me miras, como haces que todo sea mejor solo con estar.',
    'Gracias por ser mi companera, mi confidente y mi lugar favorito en el mundo.',
    'Si pudiera elegir de nuevo, te eligiria a ti mil veces sin dudarlo.',
    'Eres mi calma, mi alegria y la razon por la que sonrio sin motivo.',
    'Cada momento contigo se siente como un sueño del que no quiero despertar.',
    'Tu eres mi historia favorita, la que quiero seguir escribiendo por siempre.',
    'Me haces creer en la magia, porque no hay otra forma de explicar lo que siento por ti.',
    'Prometo estar ahi en los buenos y en los malos, porque contigo todo vale la pena.',
];

const chooseCollagePiece = (pieces: CollagePieceReward[], unlockedPieces: string[]) => {
    const missingPieces = pieces.filter((piece) => !unlockedPieces.includes(piece.id));

    if (missingPieces.length === 0) {
        return null;
    }

    return missingPieces[Math.floor(Math.random() * missingPieces.length)];
};

const canClaimDailyReward = (claimedAt?: string | null) => {
    return !claimedAt || claimedAt.slice(0, 10) !== dateKey();
};

const getOfflineEnergyGain = (lastSeenAt: string | null | undefined, savedEnergy: number, maxEnergy: number) => {
    if (!lastSeenAt || savedEnergy >= maxEnergy) {
        return 0;
    }

    const lastSeenTime = new Date(lastSeenAt).getTime();

    if (Number.isNaN(lastSeenTime)) {
        return 0;
    }

    const minutesAway = Math.floor((Date.now() - lastSeenTime) / 60000);

    return Math.max(0, Math.min(maxEnergy - savedEnergy, minutesAway));
};

const csrfToken = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

const readLocalSave = (key: string): MelodyGameSave | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const saved = window.localStorage.getItem(key);

        if (!saved) {
            return null;
        }

        return JSON.parse(saved) as MelodyGameSave;
    } catch {
        return null;
    }
};

const writeLocalSave = (key: string, state: MelodyGameSave) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
        // Local storage can be unavailable in private browsing or low-storage modes.
    }
};

const mostRecentSave = (serverSave: MelodyGameSave | null | undefined, localSave: MelodyGameSave | null) => {
    if (!localSave) {
        return serverSave ?? null;
    }

    if (!serverSave) {
        return localSave;
    }

    const serverTime = serverSave.lastSeenAt ? new Date(serverSave.lastSeenAt).getTime() : 0;
    const localTime = localSave.lastSeenAt ? new Date(localSave.lastSeenAt).getTime() : 0;

    return localTime > serverTime ? localSave : serverSave;
};

const triggerFeedback = () => {
    if ('vibrate' in navigator) {
        navigator.vibrate(18);
    }
};

export default function MelodyMergePage({
    cards,
    cardRarities = [],
    collagePhotos = [],
    gameConfig,
    gamePacks = [],
    gameRules,
    mergeItems = [],
    missions: configuredMissions = [],
    musicTracks = [],
    playerLevels = [],
    gameSave,
    auth,
}: MelodyMergePageProps) {
    const localSaveKey = `melody-game-save:${auth?.user?.id ?? auth?.user?.email ?? 'guest'}`;
    const initialGameSave = mostRecentSave(gameSave, readLocalSave(localSaveKey));
    const config = {
        ...fallbackGameConfig,
        ...gameConfig,
    };
    const rules = {
        ...fallbackGameRules,
        ...gameRules,
    };
    const maxEnergy = Math.max(1, config.maxEnergy);
    const dailyReward = {
        energy: Math.max(0, config.dailyRewardEnergy),
        hearts: Math.max(0, config.dailyRewardHearts),
    };
    const levelDefinitions = useMemo(
        () => playerLevels.length > 0 ? playerLevels : fallbackPlayerLevels,
        [playerLevels],
    );
    const getPlayerLevel = useCallback((level: number) => {
        return levelDefinitions.find((item) => item.level === level)
            ?? fallbackPlayerLevels[Math.min(Math.max(level, 1), fallbackPlayerLevels.length) - 1];
    }, [levelDefinitions]);
    const duplicateHeartRewards = useMemo<Record<CardRarity, number>>(() => {
        const rewards = { ...fallbackDuplicateHeartRewards };

        cardRarities.forEach((rarity) => {
            rewards[rarity.code] = rarity.duplicateHearts;
        });

        return rewards;
    }, [cardRarities]);
    const missionDefinitions = useMemo(
        () => configuredMissions.length > 0 ? configuredMissions : fallbackMissions,
        [configuredMissions],
    );
    const packDefinitions = useMemo(
        () => gamePacks.length > 0 ? gamePacks : fallbackGamePacks,
        [gamePacks],
    );
    const getPack = useCallback((triggerKey: GamePackDefinition['triggerKey']) => {
        return packDefinitions.find((pack) => pack.triggerKey === triggerKey)
            ?? (fallbackGamePacks.find((pack) => pack.triggerKey === triggerKey) as GamePackDefinition);
    }, [packDefinitions]);
    const premiumPack = getPack('premium');
    const cardPool = useMemo<MelodyCard[]>(() => cards.map((card) => ({
        ...card,
        imageUrl: getCardImage(card.imagePath),
    })), [cards]);
    const mergeItemPool = useMemo<MergeItemDefinition[]>(() => {
        const source = mergeItems.length > 0 ? mergeItems : mergeChain;

        return source.map((item) => ({
            ...item,
            imageUrl: getAssetImage(item.imagePath),
        }));
    }, [mergeItems]);
    const maxMergeItemLevel = useMemo(
        () => Math.max(...mergeItemPool.map((item) => item.level), mergeChain.length),
        [mergeItemPool],
    );
    const getMergeLevel = useCallback((level: number) => getLevel(level, mergeItemPool), [mergeItemPool]);
    const cardsById = useMemo(() => new Map(cardPool.map((card) => [card.id, card])), [cardPool]);
    const collagePiecePool = useMemo<CollagePieceReward[]>(() => collagePhotos.flatMap((photo) => (
        Array.from({ length: photo.piecesCount }, (_, pieceIndex) => ({
            id: collagePieceId(photo.id, pieceIndex),
            photoId: photo.id,
            pieceIndex,
            label: photo.label,
            imageUrl: photo.url,
        }))
    )), [collagePhotos]);
    const savedEnergy = Math.min(Math.max(initialGameSave?.energy ?? 84, 0), maxEnergy);
    const offlineEnergyGain = getOfflineEnergyGain(initialGameSave?.lastSeenAt, savedEnergy, maxEnergy);
    const [board, setBoard] = useState<Array<BoardItem | null>>(() => normalizeBoard(initialGameSave?.board));
    const [energy, setEnergy] = useState(Math.min(savedEnergy + offlineEnergyGain, maxEnergy));
    const [hearts, setHearts] = useState(Math.max(initialGameSave?.hearts ?? 120, 0));
    const [xp, setXp] = useState(Math.max(initialGameSave?.xp ?? 0, 0));
    const [playerLevel, setPlayerLevel] = useState(Math.max(initialGameSave?.playerLevel ?? 1, 1));
    const [mergeCount, setMergeCount] = useState(Math.max(initialGameSave?.mergeCount ?? 0, 0));
    const [openedPacks, setOpenedPacks] = useState<PackReward[]>(() => normalizePacks(cardsById, initialGameSave?.openedPacks));
    const [collagePieces, setCollagePieces] = useState<string[]>(() => normalizeCollagePieces(initialGameSave?.collagePieces));
    const [claimedMissions, setClaimedMissions] = useState<string[]>(() => initialGameSave?.claimedMissions ?? []);
    const [dailyRewardClaimedAt, setDailyRewardClaimedAt] = useState<string | null>(initialGameSave?.dailyRewardClaimedAt ?? null);
    const [showDailyReward, setShowDailyReward] = useState(() => canClaimDailyReward(initialGameSave?.dailyRewardClaimedAt));
    const [pendingPack, setPendingPack] = useState<PackReward | null>(null);
    const [selectedAlbumCard, setSelectedAlbumCard] = useState<MelodyCard | null>(null);
    const [albumFilter, setAlbumFilter] = useState<CardRarity | 'all'>('all');
    const [isPackOpened, setIsPackOpened] = useState(false);
    const [dismissedPackCards, setDismissedPackCards] = useState(0);
    const [packCardResults, setPackCardResults] = useState<PackCardResult[]>([]);
    const [assetsReady, setAssetsReady] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [selectedCell, setSelectedCell] = useState<number | null>(null);
    const [draggedCell, setDraggedCell] = useState<number | null>(null);
    const [touchDrag, setTouchDrag] = useState<{
        index: number;
        x: number;
        y: number;
        item: BoardItem;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<MelodyTab>(() => normalizeTab(initialGameSave?.activeTab));
    const [musicPlaying, setMusicPlaying] = useState(() => music.getState().playing);
    const [toastMessage, setToastMessage] = useState(
        offlineEnergyGain > 0
            ? `Recuperaste ${offlineEnergyGain} energia mientras no estabas.`
            : getDailyMessage(),
    );
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const dragStartRef = useRef<{ index: number; x: number; y: number } | null>(null);
    const didPointerDragRef = useRef(false);
    const didMountSaveRef = useRef(offlineEnergyGain > 0);
    const saveTimerRef = useRef<number | null>(null);
    const memoryTimerRef = useRef<number | null>(null);
    const memoryResetTimerRef = useRef<number | null>(null);
    const saveStatusLabel = {
        error: 'Sin guardar',
        idle: 'Guardado',
        saved: 'Guardado',
        saving: 'Guardando',
    }[saveStatus];
    const memorySource = useMemo(
        () => mergeItemPool.filter((item) => item.isActive).slice(0, 8),
        [mergeItemPool],
    );
    const createMemoryDeck = useCallback(() => shuffle(memorySource.flatMap((item) => [
        {
            id: nanoid(),
            pairId: `memory-${item.level}`,
            item,
            isMatched: false,
        },
        {
            id: nanoid(),
            pairId: `memory-${item.level}`,
            item,
            isMatched: false,
        },
    ])), [memorySource]);
    const [memoryDeck, setMemoryDeck] = useState<MemoryCard[]>(() => createMemoryDeck());
    const [flippedMemoryCards, setFlippedMemoryCards] = useState<string[]>([]);
    const [memoryMatches, setMemoryMatches] = useState(0);
    const [memoryMoves, setMemoryMoves] = useState(0);
    const [memoryLocked, setMemoryLocked] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showLevelUpFlash, setShowLevelUpFlash] = useState(false);
    const [loveLetterIndex, setLoveLetterIndex] = useState(() => Math.floor(Math.random() * loveLetterMessages.length));
    const [dailyStreak, setDailyStreak] = useState(() => readStreak().count);
    const [sparklePosition, setSparklePosition] = useState<{ x: number; y: number } | null>(null);

    const notify = useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    const postSave = useCallback((state: MelodyGameSave, keepalive = false) => {
        const body = JSON.stringify({ state, _token: csrfToken() });

        setSaveStatus('saving');

        return fetch('/melody/save', {
            method: keepalive ? 'POST' : 'PUT',
            keepalive,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body,
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Save failed');
            }

            setSaveStatus('saved');
            window.setTimeout(() => setSaveStatus('idle'), 1200);
        }).catch(() => {
            setSaveStatus('error');
            notify('No se pudo guardar la partida. Revisa tu conexion.');
        });
    }, [notify]);

    const beaconSave = useCallback((state: MelodyGameSave) => {
        if (!navigator.sendBeacon) {
            void postSave(state, true);

            return;
        }

        const body = JSON.stringify({ state, _token: csrfToken() });
        const blob = new Blob([body], { type: 'application/json' });

        if (!navigator.sendBeacon('/melody/save', blob)) {
            void postSave(state, true);
        }
    }, [postSave]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setEnergy((value) => Math.min(maxEnergy, value + 1));
        }, 60000);

        return () => window.clearInterval(timer);
    }, [maxEnergy]);

    useEffect(() => {
        if (memoryTimerRef.current) {
            window.clearTimeout(memoryTimerRef.current);
            memoryTimerRef.current = null;
        }

        if (memoryResetTimerRef.current) {
            window.clearTimeout(memoryResetTimerRef.current);
            memoryResetTimerRef.current = null;
        }

        setMemoryDeck(createMemoryDeck());
        setFlippedMemoryCards([]);
        setMemoryMatches(0);
        setMemoryMoves(0);
        setMemoryLocked(false);
    }, [createMemoryDeck]);

    useEffect(() => () => {
        if (memoryTimerRef.current) {
            window.clearTimeout(memoryTimerRef.current);
            memoryTimerRef.current = null;
        }

        if (memoryResetTimerRef.current) {
            window.clearTimeout(memoryResetTimerRef.current);
            memoryResetTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!toastMessage) return;

        const timer = window.setTimeout(() => setToastMessage(''), 2600);

        return () => window.clearTimeout(timer);
    }, [toastMessage]);

    useEffect(() => {
        const timer = window.setTimeout(() => setShowSplash(false), assetsReady ? 1300 : 2400);

        return () => window.clearTimeout(timer);
    }, [assetsReady]);

    useEffect(() => {
        void music.init(musicTracks);
        const unsub = music.subscribe((state) => setMusicPlaying(state.playing));

        return unsub;
    }, [musicTracks]);

    useEffect(() => {
        let cancelled = false;
        const urls = [
            packImageUrl,
            ...cardPool.map((card) => card.imageUrl),
            ...collagePhotos.map((photo) => photo.url),
            ...mergeItemPool.map((item) => item.imageUrl),
        ].filter(Boolean);

        const preloadImage = (url: string) =>
            new Promise<void>((resolve) => {
                const image = new Image();
                image.decoding = 'async';
                image.onload = () => resolve();
                image.onerror = () => resolve();
                image.src = url;

                if ('decode' in image) {
                    image.decode().then(resolve).catch(resolve);
                }
            });

        Promise.all(urls.map(preloadImage)).then(() => {
            if (!cancelled) setAssetsReady(true);
        });

        return () => {
            cancelled = true;
        };
    }, [cardPool, collagePhotos, mergeItemPool]);

    const collectedCards = useMemo(() => {
        const unique = new Map<string, MelodyCard>();
        openedPacks.forEach((pack) => pack.cards.forEach((card) => unique.set(card.id, card)));

        return [...unique.values()];
    }, [openedPacks]);

    const xpGoal = getPlayerLevel(playerLevel).xpRequired;
    const albumPercent = cardPool.length > 0 ? Math.round((collectedCards.length / cardPool.length) * 100) : 0;
    const collectedIds = useMemo(() => new Set(collectedCards.map((card) => card.id)), [collectedCards]);
    const filteredAlbumCards = useMemo(
        () => albumFilter === 'all' ? cardPool : cardPool.filter((card) => card.rarity === albumFilter),
        [albumFilter, cardPool],
    );
    const totalCollagePieces = collagePiecePool.length;
    const collagePercent = totalCollagePieces > 0 ? Math.round((collagePieces.length / totalCollagePieces) * 100) : 0;
    const collageTiles = collagePiecePool.map((piece) => {
        const row = Math.floor(piece.pieceIndex / collageColumns);
        const column = piece.pieceIndex % collageColumns;

        return {
            column,
            imageUrl: piece.imageUrl,
            index: piece.pieceIndex,
            label: piece.label,
            owned: collagePieces.includes(piece.id),
            pieceId: piece.id,
            row,
        };
    });
    const rarityStats = useMemo(() => {
        const stats: Record<string, { owned: number; total: number }> = {};

        cardPool.forEach((card) => {
            if (!stats[card.rarity]) {
                stats[card.rarity] = { owned: 0, total: 0 };
            }

            stats[card.rarity].total += 1;

            if (collectedIds.has(card.id)) {
                stats[card.rarity].owned += 1;
            }
        });

        return stats;
    }, [cardPool, collectedIds]);
    const savePayload = useMemo<MelodyGameSave>(() => ({
        board,
        energy,
        hearts,
        xp,
        playerLevel,
        mergeCount,
        openedPacks: openedPacks
            .filter((pack) => pack.cards.length > 0)
            .map((pack) => ({
                id: pack.id,
                label: pack.label,
                cards: pack.cards.map((card) => card.id),
            })),
        collagePieces,
        activeTab,
        claimedMissions,
        dailyRewardClaimedAt,
        lastSeenAt: new Date().toISOString(),
    }), [activeTab, board, claimedMissions, collagePieces, dailyRewardClaimedAt, energy, hearts, mergeCount, openedPacks, playerLevel, xp]);

    useEffect(() => {
        writeLocalSave(localSaveKey, savePayload);
    }, [localSaveKey, savePayload]);

    useEffect(() => {
        if (!didMountSaveRef.current) {
            didMountSaveRef.current = true;

            return;
        }

        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = window.setTimeout(() => {
            void postSave(savePayload);
        }, 850);

        return () => {
            if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current);
            }
        };
    }, [postSave, savePayload]);

    useEffect(() => {
        const saveBeforeLeaving = () => {
            if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current);
            }

            writeLocalSave(localSaveKey, savePayload);
            beaconSave(savePayload);
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                saveBeforeLeaving();
            }
        };

        window.addEventListener('pagehide', saveBeforeLeaving);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('pagehide', saveBeforeLeaving);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [beaconSave, localSaveKey, savePayload]);

    const queuePack = useCallback((pack: GamePackDefinition, labelOverride?: string) => {
        const rewardCount = Math.max(1, Math.min(pack.cardsCount, 3));
        const packCards: MelodyCard[] = [];
        const packCollagePieces: CollagePieceReward[] = [];
        const plannedCollagePieces = [...collagePieces];

        for (let index = 0; index < rewardCount; index += 1) {
            const cardReward = chooseCard(cardPool);
            const collageReward = chooseCollagePiece(collagePiecePool, plannedCollagePieces);
            const preferCollage = Math.random() < 0.5;

            if ((preferCollage && collageReward) || !cardReward) {
                if (collageReward) {
                    packCollagePieces.push(collageReward);
                    plannedCollagePieces.push(collageReward.id);
                }

                continue;
            }

            packCards.push(cardReward);
        }

        if (packCards.length === 0 && packCollagePieces.length === 0) {
            notify('No hay cartas ni piezas de collage disponibles para abrir sobres.');

            return;
        }

        setPendingPack({
            id: nanoid(),
            label: labelOverride ?? pack.label,
            cards: packCards,
            collagePieces: packCollagePieces,
        });
        setIsPackOpened(false);
        setDismissedPackCards(0);
        setPackCardResults([]);
        notify(assetsReady ? `${labelOverride ?? pack.label}: toca el sobre para abrirlo.` : 'Preparando cartas para el sobre.');
    }, [assetsReady, cardPool, collagePiecePool, collagePieces, notify]);

    const revealPendingPack = useCallback(() => {
        if (!pendingPack || isPackOpened) return;

        const ownedIds = new Set(collectedCards.map((card) => card.id));
        const newCollagePieces = pendingPack.collagePieces ?? [];
        const newCards: MelodyCard[] = [];
        const duplicatedCards: MelodyCard[] = [];
        const nextResults: PackCardResult[] = [];

        pendingPack.cards.forEach((card) => {
            if (ownedIds.has(card.id)) {
                duplicatedCards.push(card);
                nextResults.push({
                    status: 'duplicate',
                    bonusHearts: duplicateHeartRewards[card.rarity],
                });

                return;
            }

            ownedIds.add(card.id);
            newCards.push(card);
            nextResults.push({
                status: 'new',
                bonusHearts: 0,
            });
        });

        if (duplicatedCards.length > 0) {
            const duplicateHearts = duplicatedCards.reduce((total, card) => total + duplicateHeartRewards[card.rarity], 0);
            setHearts((value) => value + duplicateHearts);

            if (newCards.length > 0 || newCollagePieces.length > 0) {
                notify(`${newCards.length} carta(s), ${newCollagePieces.length} pieza(s) y duplicadas +${duplicateHearts}.`);
            } else {
                notify(`Cartas duplicadas convertidas en +${duplicateHearts} corazones.`);
            }
        } else if (newCollagePieces.length > 0) {
            notify(`${newCards.length} carta(s) y ${newCollagePieces.length} pieza(s) del recuerdo.`);
        } else {
            notify(`${newCards.length} cartas nuevas agregadas al album.`);
        }

        if (newCollagePieces.length > 0) {
            setCollagePieces((pieces) => [...pieces, ...newCollagePieces.map((piece) => piece.id)]);
        }

        setOpenedPacks((packs) => [pendingPack, ...packs]);
        setPackCardResults(nextResults);
        setIsPackOpened(true);
        setDismissedPackCards(0);
        sfx.cardReveal();
    }, [collectedCards, duplicateHeartRewards, isPackOpened, notify, pendingPack]);

    const claimDailyReward = useCallback(() => {
        const now = new Date().toISOString();

        setDailyRewardClaimedAt(now);
        setShowDailyReward(false);
        setEnergy((value) => Math.min(maxEnergy, value + dailyReward.energy));
        setHearts((value) => value + dailyReward.hearts);
        const newStreak = updateStreak();
        setDailyStreak(newStreak);
        setShowConfetti(true);
        window.setTimeout(() => setShowConfetti(false), 2600);
        triggerFeedback();
        sfx.claim();
        queuePack(getPack('daily'));
        notify(`Recompensa diaria: +${dailyReward.energy} energia y +${dailyReward.hearts} corazones. Racha: ${newStreak} dias.`);
    }, [dailyReward.energy, dailyReward.hearts, getPack, maxEnergy, notify, queuePack]);

    const advancePackCard = useCallback(() => {
        setDismissedPackCards((value) => Math.min(value + 1, pendingPack?.cards.length ?? value + 1));
    }, [pendingPack]);

    const addProgress = useCallback((itemLevel: number) => {
        const item = getMergeLevel(itemLevel);
        const gainedXp = item.xp;
        const gainedHearts = item.hearts;

        setHearts((value) => value + gainedHearts);
        setMergeCount((value) => value + 1);

        setXp((currentXp) => {
            let nextXp = currentXp + gainedXp;
            let nextLevel = playerLevel;
            let levelsGained = 0;
            let gainedEnergy = 0;
            let rewardPackTrigger: GamePackDefinition['triggerKey'] | null = null;

            while (nextXp >= getPlayerLevel(nextLevel).xpRequired) {
                const levelDefinition = getPlayerLevel(nextLevel);
                nextXp -= levelDefinition.xpRequired;
                gainedEnergy += levelDefinition.rewardEnergy;
                rewardPackTrigger = levelDefinition.rewardPackTrigger ?? rewardPackTrigger;
                nextLevel += 1;
                levelsGained += 1;
            }

            if (levelsGained > 0) {
                setPlayerLevel(nextLevel);
                setEnergy((prev) => Math.min(maxEnergy, prev + gainedEnergy));
                const levelPack = getPack(rewardPackTrigger ?? 'level');
                queuePack(levelPack, levelsGained > 1 ? `${levelPack.label} x${levelsGained}` : levelPack.label);
                sfx.levelUp();
                setShowConfetti(true);
                setShowLevelUpFlash(true);
                window.setTimeout(() => setShowConfetti(false), 2600);
                window.setTimeout(() => setShowLevelUpFlash(false), 800);
                notify(levelsGained > 1 ? `Subiste ${levelsGained} niveles y ganaste energia.` : 'Subiste de nivel y ganaste energia.');
            } else {
                notify(`+${gainedXp} XP y +${gainedHearts} corazones.`);
            }

            return nextXp;
        });
    }, [getMergeLevel, getPack, getPlayerLevel, maxEnergy, notify, playerLevel, queuePack]);

    const mergeCells = useCallback((from: number, to: number) => {
        if (from === to) return;

        let mergedLevel: number | null = null;

        setBoard((current) => {
            const origin = current[from];
            const target = current[to];

            if (!origin) return current;

            const next = [...current];

            if (!target) {
                next[to] = origin;
                next[from] = null;
                notify('Objeto movido.');

                return next;
            }

            if (origin.level !== target.level) {
                notify('Solo se fusionan objetos iguales.');

                return current;
            }

            const newLevel = Math.min(origin.level + 1, maxMergeItemLevel);
            next[to] = makeItem(newLevel);
            next[from] = null;
            mergedLevel = origin.level;

            return next;
        });

        if (mergedLevel !== null) {
            triggerFeedback();
            sfx.merge();
            addProgress(mergedLevel);

            const targetCell = document.querySelector(`[data-cell-index="${to}"]`);

            if (targetCell) {
                const rect = targetCell.getBoundingClientRect();
                setSparklePosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                window.setTimeout(() => setSparklePosition(null), 750);
            }

            const newLevel = Math.min(mergedLevel + 1, maxMergeItemLevel);

            if (newLevel >= rules.mergePackMinLevel && Math.random() * 100 < rules.mergePackChancePercent) {
                queuePack(getPack('merge'));
            }
        }
    }, [addProgress, getPack, maxMergeItemLevel, notify, queuePack, rules.mergePackChancePercent, rules.mergePackMinLevel]);

    const generateItem = useCallback(() => {
        if (energy <= 0) {
            notify('La caja magica necesita energia.');

            return;
        }

        setBoard((current) => {
            const firstEmpty = current.findIndex((cell) => !cell);

            if (firstEmpty === -1) {
                notify('El tablero esta lleno. Fusiona para abrir espacio.');

                return current;
            }

            const next = [...current];
            const generatedLevel = Math.random() * 100 < rules.magicBoxBonusChancePercent
                ? rules.magicBoxBonusLevel
                : rules.magicBoxPrimaryLevel;
            const level = Math.min(Math.max(1, generatedLevel), maxMergeItemLevel);
            next[firstEmpty] = makeItem(level);

            return next;
        });

        setEnergy((value) => value - 1);
        triggerFeedback();
        sfx.magicBox();
        notify('La caja magica dejo una semilla.');
    }, [energy, maxMergeItemLevel, notify, rules.magicBoxBonusChancePercent, rules.magicBoxBonusLevel, rules.magicBoxPrimaryLevel]);

    const buyPack = useCallback(() => {
        const premiumPack = getPack('premium');

        if (hearts < premiumPack.costHearts) {
            notify(`Necesitas ${premiumPack.costHearts} corazones para comprar un sobre.`);

            return;
        }

        setHearts((value) => value - premiumPack.costHearts);
        triggerFeedback();
        sfx.packOpen();
        queuePack(premiumPack);
    }, [getPack, hearts, notify, queuePack]);

    const resetMemoryGame = useCallback(() => {
        if (memoryTimerRef.current) {
            window.clearTimeout(memoryTimerRef.current);
            memoryTimerRef.current = null;
        }

        if (memoryResetTimerRef.current) {
            window.clearTimeout(memoryResetTimerRef.current);
            memoryResetTimerRef.current = null;
        }

        setMemoryDeck(createMemoryDeck());
        setFlippedMemoryCards([]);
        setMemoryMatches(0);
        setMemoryMoves(0);
        setMemoryLocked(false);
        notify('Nuevo tablero de Memoria listo.');
    }, [createMemoryDeck, notify]);

    const handleMemoryCardClick = useCallback((cardId: string) => {
        if (memoryLocked || flippedMemoryCards.includes(cardId)) {
            return;
        }

        const selectedCard = memoryDeck.find((card) => card.id === cardId);

        if (!selectedCard || selectedCard.isMatched || flippedMemoryCards.length >= 2) {
            return;
        }

        const nextFlipped = [...flippedMemoryCards, cardId];
        setFlippedMemoryCards(nextFlipped);

        if (nextFlipped.length < 2) {
            return;
        }

        const [firstCard, secondCard] = nextFlipped
            .map((id) => memoryDeck.find((card) => card.id === id))
            .filter(Boolean) as MemoryCard[];

        setMemoryLocked(true);
        setMemoryMoves((value) => value + 1);

        if (memoryTimerRef.current) {
            window.clearTimeout(memoryTimerRef.current);
            memoryTimerRef.current = null;
        }

        memoryTimerRef.current = window.setTimeout(() => {
            if (firstCard.pairId === secondCard.pairId) {
                setMemoryDeck((deck) => deck.map((card) => (
                    card.pairId === firstCard.pairId ? { ...card, isMatched: true } : card
                )));
                setMemoryMatches((value) => {
                    const nextMatches = value + 1;

                    if (nextMatches === memorySource.length) {
                        const rewardHearts = 60;
                        const rewardEnergy = 10;

                        setHearts((current) => current + rewardHearts);
                        setEnergy((current) => Math.min(maxEnergy, current + rewardEnergy));
                        triggerFeedback();
                        sfx.memoryComplete();
                        setShowConfetti(true);
                        window.setTimeout(() => setShowConfetti(false), 2600);
                        notify(`Memoria completo: +${rewardHearts} corazones y +${rewardEnergy} energia.`);

                        memoryResetTimerRef.current = window.setTimeout(() => {
                            setMemoryDeck(createMemoryDeck());
                            setFlippedMemoryCards([]);
                            setMemoryMatches(0);
                            setMemoryMoves(0);
                            setMemoryLocked(false);
                            memoryResetTimerRef.current = null;
                            notify('Nueva ronda de Memoria lista.');
                        }, 1500);
                    } else {
                        sfx.memoryMatch();
                        notify(`Pareja encontrada: ${firstCard.item.name}.`);
                    }

                    return nextMatches;
                });
            } else {
                notify('Intenta otra pareja.');
            }

            setFlippedMemoryCards([]);
            setMemoryLocked(false);
            memoryTimerRef.current = null;
        }, 520);
    }, [createMemoryDeck, flippedMemoryCards, maxEnergy, memoryDeck, memoryLocked, memorySource.length, notify]);

    const claimMission = useCallback((missionId: string) => {
        const mission = missionDefinitions.find((item) => item.id === missionId);

        if (!mission || claimedMissions.includes(mission.id)) {
            return;
        }

        setClaimedMissions((missions) => [...missions, mission.id]);
        setHearts((value) => value + mission.reward.hearts);
        setEnergy((value) => Math.min(maxEnergy, value + mission.reward.energy));
        triggerFeedback();
        sfx.claim();
        notify(`Mision completada: +${mission.reward.hearts} corazones${mission.reward.energy ? ` y +${mission.reward.energy} energia` : ''}.`);
    }, [claimedMissions, maxEnergy, missionDefinitions, notify]);

    const handleCellClick = useCallback((index: number) => {
        if (didPointerDragRef.current) {
            didPointerDragRef.current = false;

            return;
        }

        if (selectedCell === null) {
            setBoard((current) => {
                if (current[index]) {
                    setSelectedCell(index);
                }

                return current;
            });

            return;
        }

        mergeCells(selectedCell, index);
        setSelectedCell(null);
    }, [mergeCells, selectedCell]);

    const handlePointerDown = useCallback((index: number, event: PointerEvent<HTMLButtonElement>) => {
        const item = board[index];

        if (!item) return;

        dragStartRef.current = {
            index,
            x: event.clientX,
            y: event.clientY,
        };
        didPointerDragRef.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [board]);

    const handlePointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
        const start = dragStartRef.current;

        if (!start) return;

        const item = board[start.index];
        const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);

        if (!item || distance < 8) return;

        didPointerDragRef.current = true;
        setTouchDrag({
            index: start.index,
            x: event.clientX,
            y: event.clientY,
            item,
        });
    }, [board]);

    const handlePointerEnd = useCallback((event: PointerEvent<HTMLButtonElement>) => {
        const start = dragStartRef.current;

        if (!start) return;

        if (didPointerDragRef.current) {
            const dropTarget = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>('[data-cell-index]');
            const targetIndex = dropTarget ? Number(dropTarget.dataset.cellIndex) : NaN;

            if (Number.isInteger(targetIndex)) {
                mergeCells(start.index, targetIndex);
                setSelectedCell(null);
            }
        }

        dragStartRef.current = null;
        setTouchDrag(null);
    }, [mergeCells]);

    const missions = missionDefinitions.map((mission) => {
        const rawValue =
            mission.progressKey === 'merge_count' ? mergeCount :
                mission.progressKey === 'collected_cards' ? collectedCards.length :
                    hearts;

        return {
            ...mission,
            value: Math.min(rawValue, mission.goal),
            completed: rawValue >= mission.goal,
            claimed: claimedMissions.includes(mission.id),
        };
    });
    const memoryProgress = memorySource.length > 0 ? Math.round((memoryMatches / memorySource.length) * 100) : 0;

    return (
        <>
            <Head title="My Home" />

            <main className="mm-app">
                <div className="mm-floating-hearts" aria-hidden>
                    <span>&#10084;</span>
                    <span>&#128150;</span>
                    <span>&#10084;</span>
                    <span>&#128156;</span>
                    <span>&#10084;</span>
                    <span>&#128150;</span>
                    <span>&#128156;</span>
                    <span>&#10084;</span>
                </div>
                {showSplash && (
                    <div className="mm-splash">
                        <div className="mm-splash__icon">
                            <img alt="My Home" className="mm-splash__logo" src={logoUrl} />
                        </div>
                        <h1>My Home</h1>
                        <p>{getSplashMessage()}</p>
                        <div className="mm-splash__loader">
                            <span />
                        </div>
                    </div>
                )}

                <section className="mm-shell" aria-label="My Home">
                    <header className="mm-header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark">
                                <img alt="My Home" className="mm-brand__logo" src={logoUrl} />
                            </div>
                            <div>
                                <p className="mm-kicker">Juego privado</p>
                                <h1>My Home</h1>
                            </div>
                        </div>

                        <div className="mm-stats" aria-label="Progreso">
                            <div className="mm-stat">
                                <Battery size={15} aria-hidden />
                                <span>{energy}</span>
                            </div>
                            <div className="mm-stat">
                                <Heart size={15} aria-hidden />
                                <span>{hearts}</span>
                            </div>
                            <div className="mm-stat">
                                <Crown size={15} aria-hidden />
                                <span>{playerLevel}</span>
                            </div>
                            <button className={`mm-logout ${musicPlaying ? 'is-playing' : ''}`} onClick={() => music.toggle()} type="button">
                                <Music size={15} aria-hidden />
                            </button>
                            {musicPlaying && (
                                <button className="mm-logout" onClick={() => music.next()} type="button">
                                    <SkipForward size={15} aria-hidden />
                                </button>
                            )}
                            <button className="mm-logout" onClick={() => router.post('/logout')} type="button">
                                <LogOut size={15} aria-hidden />
                            </button>
                            <button className="mm-logout" onClick={() => router.visit('/settings/profile')} type="button">
                                <Settings size={15} aria-hidden />
                            </button>
                            {auth?.user?.is_admin && (
                                <button className="mm-logout" onClick={() => router.visit('/admin')} type="button">
                                    <Crown size={15} aria-hidden />
                                </button>
                            )}
                        </div>
                    </header>

                    <div className="mm-progress">
                        <div className="mm-progress__meta">
                            <span>Nivel {playerLevel}</span>
                            <strong>{xp}/{xpGoal} XP</strong>
                        </div>
                        <div className="mm-progress__track">
                            <span style={{ width: `${Math.min(100, (xp / xpGoal) * 100)}%` }} />
                        </div>
                        <div className={`mm-save mm-save--${saveStatus}`} role="status">
                            <span />
                            {saveStatusLabel}
                        </div>
                    </div>

                    {activeTab === 'merge' && (
                        <section className="mm-stage">
                            <div className="mm-board" aria-label="Tablero de fusion">
                                {board.map((cell, index) => {
                                    const item = cell ? getMergeLevel(cell.level) : null;

                                    return (
                                        <button
                                            className={`mm-cell ${item ? `mm-cell--filled mm-cell--${item.symbol} ${item.imageUrl ? 'mm-cell--image' : ''}` : ''} ${selectedCell === index ? 'is-selected' : ''}`}
                                            data-cell-index={index}
                                            draggable={Boolean(cell)}
                                            key={index}
                                            onClick={() => handleCellClick(index)}
                                            onDragStart={() => setDraggedCell(index)}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={() => {
                                                if (draggedCell !== null) {
                                                    mergeCells(draggedCell, index);
                                                    setDraggedCell(null);
                                                }
                                            }}
                                            onPointerCancel={handlePointerEnd}
                                            onPointerDown={(event) => handlePointerDown(index, event)}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerEnd}
                                            type="button"
                                        >
                                            {item && (
                                                <span className={`mm-piece mm-piece--${item.symbol} ${item.imageUrl ? 'has-image' : ''}`} style={pieceStyle(item)}>
                                                    <span className="mm-piece__shine" />
                                                    {item.imageUrl && <img alt={item.name} className="mm-piece__image" src={item.imageUrl} />}
                                                    <span className="mm-piece__name">{item.name}</span>
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {touchDrag && (
                                <div
                                    className="mm-drag-preview"
                                    style={{
                                        left: touchDrag.x,
                                        top: touchDrag.y,
                                    }}
                                >
                                    {(() => {
                                        const item = getMergeLevel(touchDrag.item.level);

                                        return (
                                            <span className={`mm-piece mm-piece--${item.symbol} ${item.imageUrl ? 'has-image' : ''}`} style={pieceStyle(item)}>
                                                <span className="mm-piece__shine" />
                                                {item.imageUrl && <img alt={item.name} className="mm-piece__image" src={item.imageUrl} />}
                                                <span className="mm-piece__name">{item.name}</span>
                                            </span>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="mm-actions">
                                <button className="mm-magic-box" disabled={energy <= 0} onClick={generateItem} type="button">
                                    <span className="mm-magic-box__lid" />
                                    <span className="mm-magic-box__body">
                                        <Wand2 size={22} aria-hidden />
                                    </span>
                                    <strong>Caja magica</strong>
                                    <small>-1 energia</small>
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === 'album' && (
                        <section className="mm-album">
                            <div className="mm-album__summary">
                                <div>
                                    <p className="mm-kicker">Coleccion</p>
                                    <h2>{albumPercent}% completo</h2>
                                </div>
                                <button onClick={buyPack} type="button">
                                    <PackageOpen size={17} aria-hidden />
                                    <span>{premiumPack.costHearts}</span>
                                </button>
                            </div>

                            <section className="mm-collage" aria-label="Recuerdo secreto">
                                <div className="mm-collage__head">
                                    <div>
                                        <p className="mm-kicker">Recuerdo secreto</p>
                                        <h2>{collagePieces.length}/{totalCollagePieces} piezas</h2>
                                    </div>
                                    <span>{collagePercent}%</span>
                                </div>
                                <div
                                    className="mm-collage__grid"
                                    style={{
                                        '--mm-collage-columns': collageColumns,
                                        '--mm-collage-rows': collageRowCount,
                                    } as CSSProperties & Record<'--mm-collage-columns' | '--mm-collage-rows', number>}
                                >
                                    {collageTiles.map(({ column, imageUrl, index, label, owned, pieceId, row }) => (
                                        <button
                                            className={`mm-collage__piece ${owned ? 'is-owned' : ''}`}
                                            disabled={!owned}
                                            key={pieceId}
                                            style={{
                                                '--mm-collage-image': `url("${imageUrl}")`,
                                                '--mm-collage-x': `${(column / (collageColumns - 1)) * 100}%`,
                                                '--mm-collage-y': `${(row / (collageRowCount - 1)) * 100}%`,
                                            } as CSSProperties & Record<'--mm-collage-image' | '--mm-collage-x' | '--mm-collage-y', string>}
                                            type="button"
                                        >
                                            <span>{owned ? index + 1 : '?'}</span>
                                            {owned && <strong>{label}</strong>}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="mm-album__filters">
                                <button
                                    className={albumFilter === 'all' ? 'is-active' : ''}
                                    onClick={() => setAlbumFilter('all')}
                                    type="button"
                                >
                                    Todas <span>{collectedCards.length}/{cardPool.length}</span>
                                </button>
                                {(['C', 'R', 'SR', 'SSR', 'UR', 'SECRET'] as const).map((rarity) => {
                                    const stat = rarityStats[rarity];

                                    if (!stat) {
                                        return null;
                                    }

                                    return (
                                        <button
                                            className={`${albumFilter === rarity ? 'is-active' : ''} rarity-${rarity.toLowerCase()}`}
                                            key={rarity}
                                            onClick={() => setAlbumFilter(rarity)}
                                            type="button"
                                        >
                                            {rarity} <span>{stat.owned}/{stat.total}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mm-card-grid">
                                {filteredAlbumCards.map((card) => {
                                    const owned = collectedIds.has(card.id);

                                    return (
                                        <button
                                            className={`mm-card ${owned ? 'is-owned' : ''} rarity-${card.rarity.toLowerCase()}`}
                                            disabled={!owned}
                                            key={card.id}
                                            onClick={() => setSelectedAlbumCard(card)}
                                            type="button"
                                        >
                                            <div className="mm-card__thumb">
                                                {owned ? (
                                                    <img alt={card.name} src={card.imageUrl} />
                                                ) : (
                                                    <span>?</span>
                                                )}
                                            </div>
                                            <div>
                                                <strong>{owned ? card.name : 'Carta oculta'}</strong>
                                                <span>{card.collection}</span>
                                            </div>
                                            <small>{card.rarity}</small>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {activeTab === 'room' && (
                        <section className="mm-room">
                            <div className="mm-room__scene">
                                <span className="mm-room__window" />
                                <span className="mm-room__rug" />
                                <span className="mm-room__shelf" />
                                <span className="mm-room__bed" />
                                <span className="mm-room__pillow" />
                                <span className="mm-room__lamp" />
                                <div className="mm-room__stars" aria-hidden>
                                    <span />
                                    <span />
                                    <span />
                                </div>
                                {collectedCards.length >= 3 && <span className="mm-room__plush" />}
                                {collectedCards.length >= 6 && <span className="mm-room__poster" />}
                                {collectedCards.length >= 10 && <span className="mm-room__cat" />}
                            </div>

                            <div className="mm-love-letter">
                                <div className="mm-love-letter__header">
                                    <Mail size={17} aria-hidden />
                                    <h2>Carta para ti</h2>
                                    {dailyStreak > 0 && (
                                        <span className="mm-streak">
                                            <span className="mm-streak__fire" aria-hidden>&#128293;</span>
                                            {dailyStreak} dia{dailyStreak !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="mm-love-letter__message">
                                    <p>{loveLetterMessages[loveLetterIndex]}</p>
                                </div>
                                <div className="mm-love-letter__nav">
                                    <button onClick={() => { sfx.loveLetter(); setLoveLetterIndex((i) => (i - 1 + loveLetterMessages.length) % loveLetterMessages.length); }} type="button">
                                        <ChevronLeft size={18} aria-hidden />
                                    </button>
                                    <button onClick={() => { sfx.loveLetter(); setLoveLetterIndex((i) => (i + 1) % loveLetterMessages.length); }} type="button">
                                        <ChevronRight size={18} aria-hidden />
                                    </button>
                                </div>
                            </div>

                            <div className="mm-missions">
                                <div className="mm-section-title">
                                    <Trophy size={17} aria-hidden />
                                    <h2>Misiones diarias</h2>
                                </div>
                                {missions.map((mission) => (
                                    <div className="mm-mission" key={mission.label}>
                                        <div className="mm-mission__meta">
                                            <span>{mission.label}</span>
                                            <strong>{mission.value}/{mission.goal}</strong>
                                        </div>
                                        <div className="mm-mission__track">
                                            <span style={{ width: `${(mission.value / mission.goal) * 100}%` }} />
                                        </div>
                                        <button
                                            className="mm-mission__claim"
                                            disabled={!mission.completed || mission.claimed}
                                            onClick={() => claimMission(mission.id)}
                                            type="button"
                                        >
                                            {mission.claimed ? 'Reclamada' : mission.completed ? `Reclamar +${mission.reward.hearts}` : `Recompensa +${mission.reward.hearts}`}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeTab === 'memory' && (
                        <section className="mm-memory">
                            <div className="mm-memory__summary">
                                <div>
                                    <p className="mm-kicker">Memoria</p>
                                    <h2>{memoryProgress}% completo</h2>
                                </div>
                                <button onClick={resetMemoryGame} type="button">
                                    <RotateCcw size={16} aria-hidden />
                                    <span>{memoryMoves}</span>
                                </button>
                            </div>

                            <div className="mm-memory__board" aria-label="Tablero de Memoria">
                                {memoryDeck.map((card) => {
                                    const isFlipped = flippedMemoryCards.includes(card.id) || card.isMatched;

                                    return (
                                        <button
                                            className={`mm-memory-card ${isFlipped ? 'is-flipped' : ''} ${card.isMatched ? 'is-matched' : ''}`}
                                            disabled={memoryLocked || card.isMatched}
                                            key={card.id}
                                            onClick={() => handleMemoryCardClick(card.id)}
                                            type="button"
                                        >
                                            <span className="mm-memory-card__back">
                                                <Brain size={22} aria-hidden />
                                            </span>
                                            <span className="mm-memory-card__front">
                                                <span className={`mm-piece mm-piece--${card.item.symbol} ${card.item.imageUrl ? 'has-image' : ''}`} style={pieceStyle(card.item)}>
                                                    <span className="mm-piece__shine" />
                                                    {card.item.imageUrl && <img alt={card.item.name} className="mm-piece__image" src={card.item.imageUrl} />}
                                                    <span className="mm-piece__name">{card.item.name}</span>
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mm-memory__rewards">
                                <span>{memoryMatches}/{memorySource.length} parejas</span>
                                <span>+60 corazones</span>
                                <span>+10 energia</span>
                            </div>

                            {memoryMatches === memorySource.length && memorySource.length > 0 && (
                                <div className="mm-memory-complete">
                                    <h3>Todas las parejas encontradas</h3>
                                    <p>Recompensas reclamadas. Preparando nueva ronda...</p>
                                </div>
                            )}
                        </section>
                    )}

                    <nav className="mm-tabs" aria-label="Vistas">
                        <button className={activeTab === 'merge' ? 'is-active' : ''} onClick={() => setActiveTab('merge')} type="button">
                            <Wand2 size={19} aria-hidden />
                            <span>Merge</span>
                        </button>
                        <button className={activeTab === 'memory' ? 'is-active' : ''} onClick={() => setActiveTab('memory')} type="button">
                            <Brain size={19} aria-hidden />
                            <span>Memoria</span>
                        </button>
                        <button className={activeTab === 'album' ? 'is-active' : ''} onClick={() => setActiveTab('album')} type="button">
                            <Album size={19} aria-hidden />
                            <span>Album</span>
                        </button>
                        <button className={activeTab === 'room' ? 'is-active' : ''} onClick={() => setActiveTab('room')} type="button">
                            <Gift size={19} aria-hidden />
                            <span>Sala</span>
                        </button>
                    </nav>

                    {toastMessage && (
                        <div className="mm-toast" role="status">
                            <Sparkles size={16} aria-hidden />
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {showDailyReward && (
                        <div className="mm-daily-modal" role="dialog" aria-modal="true" aria-label="Recompensa diaria">
                            <div className="mm-daily-modal__panel">
                                <span className="mm-daily-modal__icon">
                                    <Gift size={28} aria-hidden />
                                </span>
                                <p className="mm-kicker">Recompensa diaria</p>
                                <h2>Regalo listo</h2>
                                {dailyStreak > 0 && (
                                    <span className="mm-streak">
                                        <span className="mm-streak__fire" aria-hidden>&#128293;</span>
                                        Racha: {dailyStreak} dia{dailyStreak !== 1 ? 's' : ''} seguidos
                                    </span>
                                )}
                                <div className="mm-daily-modal__rewards">
                                    <span>+{dailyReward.energy} energia</span>
                                    <span>+{dailyReward.hearts} corazones</span>
                                    <span>Sobre diario</span>
                                </div>
                                <button onClick={claimDailyReward} type="button">
                                    Reclamar
                                </button>
                                <button className="mm-daily-modal__later" onClick={() => setShowDailyReward(false)} type="button">
                                    Luego
                                </button>
                            </div>
                        </div>
                    )}

                    {pendingPack && (
                        <div className="mm-pack-modal" role="dialog" aria-modal="true" aria-label={pendingPack.label}>
                            <div className="mm-pack-modal__panel">
                                {!isPackOpened ? (
                                    <>
                                        <button className="mm-envelope" disabled={!assetsReady} onClick={revealPendingPack} type="button">
                                            <img alt={pendingPack.label} src={packImageUrl} />
                                            <span className="mm-envelope__cut">
                                                <Scissors size={18} aria-hidden />
                                            </span>
                                        </button>
                                        <p>{assetsReady ? 'Presiona la tijera para cortar el sobre.' : 'Preparando cartas...'}</p>
                                    </>
                                ) : (
                                    <>
                                        {dismissedPackCards < pendingPack.cards.length ? (
                                            <button className="mm-card-stack" onClick={advancePackCard} type="button">
                                                {pendingPack.cards.map((card, index) => (
                                                    <span
                                                        className={`mm-stack-card rarity-${card.rarity.toLowerCase()} ${
                                                            index < dismissedPackCards ? 'is-dismissed' :
                                                                index === dismissedPackCards ? 'is-active' :
                                                                    'is-waiting'
                                                        }`}
                                                        key={`${pendingPack.id}-stack-${card.id}-${index}`}
                                                        style={{ '--stack-index': index } as CSSProperties & Record<'--stack-index', number>}
                                                    >
                                                        <img alt={card.name} src={card.imageUrl} />
                                                        <small>{card.rarity}</small>
                                                    </span>
                                                ))}
                                            </button>
                                        ) : (
                                            <>
                                                <div className="mm-pack-modal__cards">
                                                    {pendingPack.cards.map((card, index) => {
                                                        const result = packCardResults[index];

                                                        return (
                                                            <div className={`mm-reward-card rarity-${card.rarity.toLowerCase()} ${result?.status === 'new' ? 'is-new' : 'is-duplicate'}`} key={`${pendingPack.id}-${card.id}-${index}`}>
                                                                <img alt={card.name} src={card.imageUrl} />
                                                                <span>{card.rarity}</span>
                                                                {result && (
                                                                    <em>
                                                                        {result.status === 'new' ? 'Nueva' : `Duplicada +${result.bonusHearts}`}
                                                                    </em>
                                                                )}
                                                                <strong>{card.name}</strong>
                                                            </div>
                                                        );
                                                    })}
                                                    {(pendingPack.collagePieces ?? []).map((piece) => (
                                                        <div className="mm-reward-card mm-reward-card--collage is-new" key={`${pendingPack.id}-${piece.id}`}>
                                                            <img alt={piece.label} src={piece.imageUrl} />
                                                            <span>Pieza</span>
                                                            <em>Nueva</em>
                                                            <strong>{piece.label}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="mm-pack-modal__close" onClick={() => setPendingPack(null)} type="button">
                                                    Guardar
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedAlbumCard && (
                        <div className="mm-card-viewer" role="dialog" aria-modal="true" aria-label={selectedAlbumCard.name}>
                            <div className={`mm-card-viewer__panel rarity-${selectedAlbumCard.rarity.toLowerCase()}`}>
                                <img alt={selectedAlbumCard.name} src={selectedAlbumCard.imageUrl} />
                                <div className="mm-card-viewer__meta">
                                    <span>{selectedAlbumCard.rarity}</span>
                                    <strong>{selectedAlbumCard.name}</strong>
                                    <p>{selectedAlbumCard.collection}</p>
                                </div>
                                <button className="mm-card-viewer__close" onClick={() => setSelectedAlbumCard(null)} type="button">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}

                    {showConfetti && (
                        <div className="mm-confetti" aria-hidden>
                            {Array.from({ length: 12 }, (_, i) => (
                                <span className="mm-confetti__piece" key={i} />
                            ))}
                        </div>
                    )}

                    {sparklePosition && (
                        <div className="mm-sparkle-burst" aria-hidden style={{ left: sparklePosition.x, top: sparklePosition.y }}>
                            {Array.from({ length: 8 }, (_, i) => (
                                <span className="mm-sparkle-burst__particle" key={i} />
                            ))}
                        </div>
                    )}

                    {showLevelUpFlash && (
                        <div className="mm-level-up-flash" aria-hidden />
                    )}
                </section>
            </main>
        </>
    );
}
