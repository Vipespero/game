import { Head, router } from '@inertiajs/react';
import {
    Album,
    Battery,
    Boxes,
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
    RefreshCw,
    Save,
    Scissors,
    Settings,
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
    BlockPiece,
    CardRarity,
    CollagePieceReward,
    MelodyCard,
    MergeItemDefinition,
    GamePackDefinition,
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

const emptyBoard = (): Array<BoardItem | null> =>
    Array.from({ length: boardSize }, () => null);

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
            level: Math.min(
                Math.max(1, Math.round(cell.level)),
                mergeChain.length,
            ),
        };
    });
};

const normalizePacks = (
    cardsById: Map<string, MelodyCard>,
    packs?: SavedPackReward[],
) => {
    if (!Array.isArray(packs)) {
        return [];
    }

    return packs
        .map((pack) => ({
            id: pack.id || nanoid(),
            label: pack.label || 'Sobre guardado',
            cards: Array.isArray(pack.cards)
                ? (pack.cards
                      .map((cardId) => cardsById.get(cardId))
                      .filter(Boolean) as MelodyCard[])
                : [],
        }))
        .filter((pack) => pack.cards.length > 0);
};

const normalizeTab = (tab?: string) => {
    return tab === 'album' ||
        tab === 'room' ||
        tab === 'memory' ||
        tab === 'blocks' ||
        tab === 'merge'
        ? tab
        : 'merge';
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
const maxSavedPackHistory = 120;
const blockBoardSide = 8;
const blockBoardSize = blockBoardSide * blockBoardSide;
const blockDragLift = 108;

const blockShapes = [
    { id: 'single', cells: [[0, 0]] },
    {
        id: 'line-2-h',
        cells: [
            [0, 0],
            [0, 1],
        ],
    },
    {
        id: 'line-2-v',
        cells: [
            [0, 0],
            [1, 0],
        ],
    },
    {
        id: 'line-3-h',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
        ],
    },
    {
        id: 'line-3-v',
        cells: [
            [0, 0],
            [1, 0],
            [2, 0],
        ],
    },
    {
        id: 'line-4-h',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
        ],
    },
    {
        id: 'line-4-v',
        cells: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
        ],
    },
    {
        id: 'square',
        cells: [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
        ],
    },
    {
        id: 'corner',
        cells: [
            [0, 0],
            [1, 0],
            [1, 1],
        ],
    },
    {
        id: 'corner-flip',
        cells: [
            [0, 1],
            [1, 0],
            [1, 1],
        ],
    },
    {
        id: 't',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [1, 1],
        ],
    },
    {
        id: 'zig',
        cells: [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 2],
        ],
    },
] as const;

const emptyBlockBoard = () => Array.from({ length: blockBoardSize }, () => 0);
const getBlockShape = (shapeId: string) =>
    blockShapes.find((shape) => shape.id === shapeId) ?? blockShapes[0];
const createBlockPieces = (): BlockPiece[] =>
    Array.from({ length: 3 }, () => ({
        id: nanoid(),
        shapeId: blockShapes[Math.floor(Math.random() * blockShapes.length)].id,
        color: Math.floor(Math.random() * 5) + 1,
    }));
const normalizeBlockBoard = (board?: number[]) =>
    Array.isArray(board) && board.length === blockBoardSize
        ? board.map((cell) => Math.min(5, Math.max(0, Math.round(cell))))
        : emptyBlockBoard();
const normalizeBlockPieces = (pieces?: BlockPiece[]) => {
    if (!Array.isArray(pieces) || pieces.length === 0) {
        return createBlockPieces();
    }

    return pieces.slice(0, 3).map((piece) => ({
        id: piece.id || nanoid(),
        shapeId: getBlockShape(piece.shapeId).id,
        color: Math.min(5, Math.max(1, Math.round(piece.color))),
    }));
};
const blockPlacementIndexes = (piece: BlockPiece, anchor: number) => {
    const anchorRow = Math.floor(anchor / blockBoardSide);
    const anchorColumn = anchor % blockBoardSide;

    return getBlockShape(piece.shapeId).cells.map(([row, column]) => {
        const nextRow = anchorRow + row;
        const nextColumn = anchorColumn + column;

        return nextRow < blockBoardSide && nextColumn < blockBoardSide
            ? nextRow * blockBoardSide + nextColumn
            : -1;
    });
};
const canPlaceBlock = (board: number[], piece: BlockPiece, anchor: number) => {
    const indexes = blockPlacementIndexes(piece, anchor);

    return indexes.every((index) => index >= 0 && board[index] === 0);
};
const canBlockPieceFit = (board: number[], piece: BlockPiece) =>
    board.some((_, anchor) => canPlaceBlock(board, piece, anchor));
const blockAnchorFromPointer = (
    piece: BlockPiece,
    clientX: number,
    clientY: number,
) => {
    const target = document
        .elementFromPoint(clientX, clientY - blockDragLift)
        ?.closest<HTMLElement>('[data-block-index]');
    const hoveredIndex = target
        ? Number(target.dataset.blockIndex)
        : Number.NaN;

    if (!Number.isInteger(hoveredIndex)) {
        return null;
    }

    const shape = getBlockShape(piece.shapeId);
    const shapeHeight = Math.max(...shape.cells.map(([row]) => row)) + 1;
    const shapeWidth = Math.max(...shape.cells.map(([, column]) => column)) + 1;
    const hoveredRow = Math.floor(hoveredIndex / blockBoardSide);
    const hoveredColumn = hoveredIndex % blockBoardSide;
    const anchorRow = hoveredRow - Math.floor((shapeHeight - 1) / 2);
    const anchorColumn = hoveredColumn - Math.floor((shapeWidth - 1) / 2);

    if (anchorRow < 0 || anchorColumn < 0) {
        return null;
    }

    return anchorRow * blockBoardSide + anchorColumn;
};

const normalizeCollagePieces = (pieces?: string[]) => {
    if (!Array.isArray(pieces)) {
        return [];
    }

    return [...new Set(pieces)].filter((piece) =>
        /^[1-9][0-9]*:(0[0-9]|1[0-5])$/.test(piece),
    );
};

const collagePieceId = (photoId: number, pieceIndex: number) =>
    `${photoId}:${String(pieceIndex).padStart(2, '0')}`;
const collagePieceStyle = (piece: CollagePieceReward) => {
    const pieceCol = piece.pieceIndex % collageColumns;
    const pieceRow = Math.floor(piece.pieceIndex / collageColumns);

    return {
        '--mm-collage-image': `url("${piece.imageUrl}")`,
        '--mm-collage-x': `${(pieceCol / (collageColumns - 1)) * 100}%`,
        '--mm-collage-y': `${(pieceRow / (collageRowCount - 1)) * 100}%`,
        '--mm-collage-columns': collageColumns,
        '--mm-collage-rows': collageRowCount,
    } as CSSProperties &
        Record<
            '--mm-collage-image' | '--mm-collage-x' | '--mm-collage-y',
            string
        > &
        Record<'--mm-collage-columns' | '--mm-collage-rows', number>;
};

const STREAK_KEY = 'mm-daily-streak';

const readStreak = (): { count: number; lastDate: string } => {
    try {
        const saved = localStorage.getItem(STREAK_KEY);

        if (saved)
            return JSON.parse(saved) as { count: number; lastDate: string };
    } catch {
        /* ignore */
    }

    return { count: 0, lastDate: '' };
};

const updateStreak = (): number => {
    const streak = readStreak();
    const today = dateKey();
    const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);

    if (streak.lastDate === today) {
        return streak.count;
    }

    const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1;

    try {
        localStorage.setItem(
            STREAK_KEY,
            JSON.stringify({ count: newCount, lastDate: today }),
        );
    } catch {
        /* ignore */
    }

    return newCount;
};

const loveLetterMessages = [
    'Quería recordarte que eres la persona más especial del mundo para mí. Cada día a tu lado es un regalo.',
    'No importa lo difícil que sea el día, saber que te tengo a ti me hace todo más llevadero.',
    'Me encanta cómo te ríes, cómo me miras, cómo haces que todo sea mejor solo con estar.',
    'Gracias por ser mi compañera, mi confidente y mi lugar favorito en el mundo.',
    'Si pudiera elegir de nuevo, te elegiría a ti mil veces sin dudarlo.',
    'Eres mi calma, mi alegría y la razón por la que sonrío sin motivo.',
    'Cada momento contigo se siente como un sueño del que no quiero despertar.',
    'Tú eres mi historia favorita, la que quiero seguir escribiendo por siempre.',
    'Me haces creer en la magia, porque no hay otra forma de explicar lo que siento por ti.',
    'Prometo estar ahí en los buenos y en los malos, porque contigo todo vale la pena.',
];

const chooseCollagePiece = (
    pieces: CollagePieceReward[],
    unlockedPieces: string[],
) => {
    const missingPieces = pieces.filter(
        (piece) => !unlockedPieces.includes(piece.id),
    );

    if (missingPieces.length === 0) {
        return null;
    }

    return missingPieces[Math.floor(Math.random() * missingPieces.length)];
};

const canClaimDailyReward = (claimedAt?: string | null) => {
    return !claimedAt || claimedAt.slice(0, 10) !== dateKey();
};

const getOfflineEnergyGain = (
    lastSeenAt: string | null | undefined,
    savedEnergy: number,
    maxEnergy: number,
) => {
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

const csrfToken = () =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.content ?? '';

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

const mostRecentSave = (
    serverSave: MelodyGameSave | null | undefined,
    localSave: MelodyGameSave | null,
) => {
    if (!localSave) {
        return serverSave ?? null;
    }

    if (!serverSave) {
        return localSave;
    }

    const serverTime = serverSave.lastSeenAt
        ? new Date(serverSave.lastSeenAt).getTime()
        : 0;
    const localTime = localSave.lastSeenAt
        ? new Date(localSave.lastSeenAt).getTime()
        : 0;

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
    const initialGameSave = mostRecentSave(
        gameSave,
        readLocalSave(localSaveKey),
    );
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
        () => (playerLevels.length > 0 ? playerLevels : fallbackPlayerLevels),
        [playerLevels],
    );
    const getPlayerLevel = useCallback(
        (level: number) => {
            return (
                levelDefinitions.find((item) => item.level === level) ??
                fallbackPlayerLevels[
                    Math.min(Math.max(level, 1), fallbackPlayerLevels.length) -
                        1
                ]
            );
        },
        [levelDefinitions],
    );
    const duplicateHeartRewards = useMemo<Record<CardRarity, number>>(() => {
        const rewards = { ...fallbackDuplicateHeartRewards };

        cardRarities.forEach((rarity) => {
            rewards[rarity.code] = rarity.duplicateHearts;
        });

        return rewards;
    }, [cardRarities]);
    const missionDefinitions = useMemo(
        () =>
            configuredMissions.length > 0
                ? configuredMissions
                : fallbackMissions,
        [configuredMissions],
    );
    const packDefinitions = useMemo(
        () => (gamePacks.length > 0 ? gamePacks : fallbackGamePacks),
        [gamePacks],
    );
    const getPack = useCallback(
        (triggerKey: GamePackDefinition['triggerKey']) => {
            return (
                packDefinitions.find(
                    (pack) => pack.triggerKey === triggerKey,
                ) ??
                (fallbackGamePacks.find(
                    (pack) => pack.triggerKey === triggerKey,
                ) as GamePackDefinition)
            );
        },
        [packDefinitions],
    );
    const premiumPack = getPack('premium');
    const cardPool = useMemo<MelodyCard[]>(
        () =>
            cards.map((card) => ({
                ...card,
                imageUrl: getCardImage(card.imagePath),
            })),
        [cards],
    );
    const mergeItemPool = useMemo<MergeItemDefinition[]>(() => {
        const source = mergeItems.length > 0 ? mergeItems : mergeChain;

        return source.map((item) => ({
            ...item,
            imageUrl: getAssetImage(item.imagePath),
        }));
    }, [mergeItems]);
    const maxMergeItemLevel = useMemo(
        () =>
            Math.max(
                ...mergeItemPool.map((item) => item.level),
                mergeChain.length,
            ),
        [mergeItemPool],
    );
    const getMergeLevel = useCallback(
        (level: number) => getLevel(level, mergeItemPool),
        [mergeItemPool],
    );
    const cardsById = useMemo(
        () => new Map(cardPool.map((card) => [card.id, card])),
        [cardPool],
    );
    const collagePiecePool = useMemo<CollagePieceReward[]>(
        () =>
            collagePhotos.flatMap((photo) =>
                Array.from({ length: photo.piecesCount }, (_, pieceIndex) => ({
                    id: collagePieceId(photo.id, pieceIndex),
                    photoId: photo.id,
                    pieceIndex,
                    label: photo.label,
                    imageUrl: photo.url,
                })),
            ),
        [collagePhotos],
    );
    const savedEnergy = Math.min(
        Math.max(initialGameSave?.energy ?? 84, 0),
        maxEnergy,
    );
    const offlineEnergyGain = getOfflineEnergyGain(
        initialGameSave?.lastSeenAt,
        savedEnergy,
        maxEnergy,
    );
    const [board, setBoard] = useState<Array<BoardItem | null>>(() =>
        normalizeBoard(initialGameSave?.board),
    );
    const [energy, setEnergy] = useState(
        Math.min(savedEnergy + offlineEnergyGain, maxEnergy),
    );
    const [hearts, setHearts] = useState(
        Math.max(initialGameSave?.hearts ?? 120, 0),
    );
    const [xp, setXp] = useState(Math.max(initialGameSave?.xp ?? 0, 0));
    const [playerLevel, setPlayerLevel] = useState(
        Math.max(initialGameSave?.playerLevel ?? 1, 1),
    );
    const [mergeCount, setMergeCount] = useState(
        Math.max(initialGameSave?.mergeCount ?? 0, 0),
    );
    const [openedPacks, setOpenedPacks] = useState<PackReward[]>(() =>
        normalizePacks(cardsById, initialGameSave?.openedPacks),
    );
    const [collagePieces, setCollagePieces] = useState<string[]>(() =>
        normalizeCollagePieces(initialGameSave?.collagePieces),
    );
    const [activeCollageIndex, setActiveCollageIndex] = useState(0);
    const [claimedMissions, setClaimedMissions] = useState<string[]>(
        () => initialGameSave?.claimedMissions ?? [],
    );
    const [dailyRewardClaimedAt, setDailyRewardClaimedAt] = useState<
        string | null
    >(initialGameSave?.dailyRewardClaimedAt ?? null);
    const [showDailyReward, setShowDailyReward] = useState(() =>
        canClaimDailyReward(initialGameSave?.dailyRewardClaimedAt),
    );
    const [pendingPacks, setPendingPacks] = useState<PackReward[]>([]);
    const pendingPack = pendingPacks[0] ?? null;
    const [selectedAlbumCard, setSelectedAlbumCard] =
        useState<MelodyCard | null>(null);
    const [albumFilter, setAlbumFilter] = useState<CardRarity | 'all'>('all');
    const [isPackOpened, setIsPackOpened] = useState(false);
    const [dismissedPackCards, setDismissedPackCards] = useState(0);
    const [packCardResults, setPackCardResults] = useState<PackCardResult[]>(
        [],
    );
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
    const [activeTab, setActiveTab] = useState<MelodyTab>(() =>
        normalizeTab(initialGameSave?.activeTab),
    );
    const [musicPlaying, setMusicPlaying] = useState(
        () => music.getState().playing,
    );
    const [toastMessage, setToastMessage] = useState(
        offlineEnergyGain > 0
            ? `Recuperaste ${offlineEnergyGain} energía mientras no estabas.`
            : getDailyMessage(),
    );
    const [saveStatus, setSaveStatus] = useState<
        'idle' | 'saving' | 'saved' | 'error'
    >('idle');
    const dragStartRef = useRef<{ index: number; x: number; y: number } | null>(
        null,
    );
    const didPointerDragRef = useRef(false);
    const didMountSaveRef = useRef(offlineEnergyGain > 0);
    const saveTimerRef = useRef<number | null>(null);
    const memoryTimerRef = useRef<number | null>(null);
    const memoryResetTimerRef = useRef<number | null>(null);
    const memorySource = useMemo(
        () => mergeItemPool.filter((item) => item.isActive).slice(0, 8),
        [mergeItemPool],
    );
    const createMemoryDeck = useCallback(
        () =>
            shuffle(
                memorySource.flatMap((item) => [
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
                ]),
            ),
        [memorySource],
    );
    const [memoryDeck, setMemoryDeck] = useState<MemoryCard[]>(() =>
        createMemoryDeck(),
    );
    const [flippedMemoryCards, setFlippedMemoryCards] = useState<string[]>([]);
    const [memoryMatches, setMemoryMatches] = useState(0);
    const [memoryMoves, setMemoryMoves] = useState(0);
    const [memoryLocked, setMemoryLocked] = useState(false);
    const [blockBoard, setBlockBoard] = useState<number[]>(() =>
        normalizeBlockBoard(initialGameSave?.blockBoard),
    );
    const [blockPieces, setBlockPieces] = useState<BlockPiece[]>(() =>
        normalizeBlockPieces(initialGameSave?.blockPieces),
    );
    const [blockScore, setBlockScore] = useState(
        Math.max(0, initialGameSave?.blockScore ?? 0),
    );
    const [blockBest, setBlockBest] = useState(
        Math.max(0, initialGameSave?.blockBest ?? 0),
    );
    const [blockCombo, setBlockCombo] = useState(
        Math.max(0, initialGameSave?.blockCombo ?? 0),
    );
    const [selectedBlockPieceId, setSelectedBlockPieceId] = useState<
        string | null
    >(null);
    const [blockDrag, setBlockDrag] = useState<{
        anchor: number | null;
        piece: BlockPiece;
    } | null>(null);
    const blockDidDragRef = useRef(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showLevelUpFlash, setShowLevelUpFlash] = useState(false);
    const [loveLetterIndex, setLoveLetterIndex] = useState(() =>
        Math.floor(Math.random() * loveLetterMessages.length),
    );
    const [dailyStreak, setDailyStreak] = useState(() => readStreak().count);
    const [sparklePosition, setSparklePosition] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [justMergedCell, setJustMergedCell] = useState<number | null>(null);

    const notify = useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    const postSave = useCallback(
        (state: MelodyGameSave, keepalive = false) => {
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
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Save failed');
                    }

                    setSaveStatus('saved');
                    window.setTimeout(() => setSaveStatus('idle'), 1200);
                })
                .catch(() => {
                    setSaveStatus('error');
                    notify(
                        'No se pudo guardar la partida. Revisa tu conexión.',
                    );
                });
        },
        [notify],
    );

    const beaconSave = useCallback(
        (state: MelodyGameSave) => {
            if (!navigator.sendBeacon) {
                void postSave(state, true);

                return;
            }

            const body = JSON.stringify({ state, _token: csrfToken() });
            const blob = new Blob([body], { type: 'application/json' });

            if (!navigator.sendBeacon('/melody/save', blob)) {
                void postSave(state, true);
            }
        },
        [postSave],
    );

    useEffect(() => {
        const timer = window.setInterval(() => {
            setEnergy((value) => Math.min(maxEnergy, value + 1));
        }, 60000);

        return () => window.clearInterval(timer);
    }, [maxEnergy]);

    useEffect(
        () => () => {
            if (memoryTimerRef.current) {
                window.clearTimeout(memoryTimerRef.current);
                memoryTimerRef.current = null;
            }

            if (memoryResetTimerRef.current) {
                window.clearTimeout(memoryResetTimerRef.current);
                memoryResetTimerRef.current = null;
            }
        },
        [],
    );

    useEffect(() => {
        if (!toastMessage) return;

        const timer = window.setTimeout(() => setToastMessage(''), 2600);

        return () => window.clearTimeout(timer);
    }, [toastMessage]);

    useEffect(() => {
        const timer = window.setTimeout(
            () => setShowSplash(false),
            assetsReady ? 1300 : 2400,
        );

        return () => window.clearTimeout(timer);
    }, [assetsReady]);

    useEffect(() => {
        void music.init(musicTracks);
        const unsub = music.subscribe((state) =>
            setMusicPlaying(state.playing),
        );

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
        openedPacks.forEach((pack) =>
            pack.cards.forEach((card) => unique.set(card.id, card)),
        );

        return [...unique.values()];
    }, [openedPacks]);

    const xpGoal = getPlayerLevel(playerLevel).xpRequired;
    const albumPercent =
        cardPool.length > 0
            ? Math.round((collectedCards.length / cardPool.length) * 100)
            : 0;
    const collectedIds = useMemo(
        () => new Set(collectedCards.map((card) => card.id)),
        [collectedCards],
    );
    const filteredAlbumCards = useMemo(
        () =>
            albumFilter === 'all'
                ? cardPool
                : cardPool.filter((card) => card.rarity === albumFilter),
        [albumFilter, cardPool],
    );
    const totalCollagePieces = collagePiecePool.length;
    const collagePercent =
        totalCollagePieces > 0
            ? Math.round((collagePieces.length / totalCollagePieces) * 100)
            : 0;
    const safeActiveCollageIndex = Math.min(
        activeCollageIndex,
        Math.max(collagePhotos.length - 1, 0),
    );
    const activeCollagePhoto = collagePhotos[safeActiveCollageIndex] ?? null;
    const activeCollageOwnedCount = activeCollagePhoto
        ? Array.from({ length: activeCollagePhoto.piecesCount }, (_, i) =>
              collagePieces.includes(collagePieceId(activeCollagePhoto.id, i)),
          ).filter(Boolean).length
        : 0;
    const completedPhotoIds = useMemo(() => {
        const completed = new Set<number>();

        collagePhotos.forEach((photo) => {
            const allPiecesOwned = Array.from(
                { length: photo.piecesCount },
                (_, i) => collagePieces.includes(collagePieceId(photo.id, i)),
            ).every(Boolean);

            if (allPiecesOwned && photo.piecesCount > 0) {
                completed.add(photo.id);
            }
        });

        return completed;
    }, [collagePieces, collagePhotos]);
    const collageTiles = activeCollagePhoto
        ? Array.from(
              { length: activeCollagePhoto.piecesCount },
              (_, pieceIndex) => {
                  const row = Math.floor(pieceIndex / collageColumns);
                  const column = pieceIndex % collageColumns;
                  const pieceId = collagePieceId(
                      activeCollagePhoto.id,
                      pieceIndex,
                  );

                  return {
                      column,
                      imageUrl: activeCollagePhoto.url,
                      index: pieceIndex,
                      owned: collagePieces.includes(pieceId),
                      pieceId,
                      photoId: activeCollagePhoto.id,
                      row,
                  };
              },
          )
        : [];
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
    const savePayload = useMemo<MelodyGameSave>(
        () => ({
            board,
            energy,
            hearts,
            xp,
            playerLevel,
            mergeCount,
            openedPacks: openedPacks
                .filter((pack) => pack.cards.length > 0)
                .slice(0, maxSavedPackHistory)
                .map((pack) => ({
                    id: pack.id,
                    label: pack.label,
                    cards: pack.cards.map((card) => card.id),
                })),
            collagePieces,
            blockBoard,
            blockPieces,
            blockScore,
            blockBest,
            blockCombo,
            activeTab,
            claimedMissions,
            dailyRewardClaimedAt,
            lastSeenAt: new Date().toISOString(),
        }),
        [
            activeTab,
            blockBest,
            blockBoard,
            blockCombo,
            blockPieces,
            blockScore,
            board,
            claimedMissions,
            collagePieces,
            dailyRewardClaimedAt,
            energy,
            hearts,
            mergeCount,
            openedPacks,
            playerLevel,
            xp,
        ],
    );

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
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, [beaconSave, localSaveKey, savePayload]);

    const queuePack = useCallback(
        (pack: GamePackDefinition, labelOverride?: string) => {
            const rewardCount = Math.max(1, Math.min(pack.cardsCount, 3));
            const packCards: MelodyCard[] = [];
            const packCollagePieces: CollagePieceReward[] = [];
            const plannedCollagePieces = [...collagePieces];

            for (let index = 0; index < rewardCount; index += 1) {
                const cardReward = chooseCard(cardPool);
                const collageReward = chooseCollagePiece(
                    collagePiecePool,
                    plannedCollagePieces,
                );
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
                notify(
                    'No hay cartas ni piezas de collage disponibles para abrir sobres.',
                );

                return;
            }

            const reward: PackReward = {
                id: nanoid(),
                label: labelOverride ?? pack.label,
                cards: packCards,
                collagePieces: packCollagePieces,
            };

            setPendingPacks((packs) => [...packs, reward]);
            notify(
                pendingPack
                    ? `${reward.label} se guardó en la fila de sobres.`
                    : assetsReady
                      ? `${reward.label}: toca el sobre para abrirlo.`
                      : 'Preparando cartas para el sobre.',
            );
        },
        [
            assetsReady,
            cardPool,
            collagePiecePool,
            collagePieces,
            notify,
            pendingPack,
        ],
    );

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
            const duplicateHearts = duplicatedCards.reduce(
                (total, card) => total + duplicateHeartRewards[card.rarity],
                0,
            );
            setHearts((value) => value + duplicateHearts);

            if (newCards.length > 0 || newCollagePieces.length > 0) {
                notify(
                    `${newCards.length} carta(s), ${newCollagePieces.length} pieza(s) y duplicadas +${duplicateHearts}.`,
                );
            } else {
                notify(
                    `Cartas duplicadas convertidas en +${duplicateHearts} corazones.`,
                );
            }
        } else if (newCollagePieces.length > 0) {
            notify(
                `${newCards.length} carta(s) y ${newCollagePieces.length} pieza(s) del recuerdo.`,
            );
        } else {
            notify(`${newCards.length} cartas nuevas agregadas al álbum.`);
        }

        if (newCollagePieces.length > 0) {
            setCollagePieces((pieces) => [
                ...pieces,
                ...newCollagePieces.map((piece) => piece.id),
            ]);
        }

        setOpenedPacks((packs) =>
            [pendingPack, ...packs].slice(0, maxSavedPackHistory),
        );
        setPackCardResults(nextResults);
        setIsPackOpened(true);
        setDismissedPackCards(0);
        sfx.cardReveal();
    }, [
        collectedCards,
        duplicateHeartRewards,
        isPackOpened,
        notify,
        pendingPack,
    ]);

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
        notify(
            `Recompensa diaria: +${dailyReward.energy} energía y +${dailyReward.hearts} corazones. Racha: ${newStreak} días.`,
        );
    }, [
        dailyReward.energy,
        dailyReward.hearts,
        getPack,
        maxEnergy,
        notify,
        queuePack,
    ]);

    const advancePackCard = useCallback(() => {
        const rewardCount =
            (pendingPack?.cards.length ?? 0) +
            (pendingPack?.collagePieces?.length ?? 0);

        setDismissedPackCards((value) =>
            Math.min(value + 1, rewardCount || value + 1),
        );
    }, [pendingPack]);

    const addProgress = useCallback(
        (itemLevel: number) => {
            const item = getMergeLevel(itemLevel);
            const gainedXp = item.xp;
            const gainedHearts = item.hearts;

            setHearts((value) => value + gainedHearts);
            setMergeCount((value) => value + 1);

            let nextXp = xp + gainedXp;
            let nextLevel = playerLevel;
            let levelsGained = 0;
            let gainedEnergy = 0;
            let rewardPackTrigger: GamePackDefinition['triggerKey'] | null =
                null;

            while (nextXp >= getPlayerLevel(nextLevel).xpRequired) {
                const levelDefinition = getPlayerLevel(nextLevel);
                nextXp -= levelDefinition.xpRequired;
                gainedEnergy += levelDefinition.rewardEnergy;
                rewardPackTrigger =
                    levelDefinition.rewardPackTrigger ?? rewardPackTrigger;
                nextLevel += 1;
                levelsGained += 1;
            }

            setXp(nextXp);

            if (levelsGained > 0) {
                setPlayerLevel(nextLevel);
                setEnergy((prev) => Math.min(maxEnergy, prev + gainedEnergy));
                const levelPack = getPack(rewardPackTrigger ?? 'level');
                queuePack(
                    levelPack,
                    levelsGained > 1
                        ? `${levelPack.label} x${levelsGained}`
                        : levelPack.label,
                );
                sfx.levelUp();
                setShowConfetti(true);
                setShowLevelUpFlash(true);
                window.setTimeout(() => setShowConfetti(false), 2600);
                window.setTimeout(() => setShowLevelUpFlash(false), 800);
                notify(
                    levelsGained > 1
                        ? `Subiste ${levelsGained} niveles y ganaste energía.`
                        : 'Subiste de nivel y ganaste energía.',
                );
            } else {
                notify(`+${gainedXp} XP y +${gainedHearts} corazones.`);
            }
        },
        [
            getMergeLevel,
            getPack,
            getPlayerLevel,
            maxEnergy,
            notify,
            playerLevel,
            queuePack,
            xp,
        ],
    );

    const mergeCells = useCallback(
        (from: number, to: number) => {
            if (from === to) return;

            const origin = board[from];
            const target = board[to];

            if (!origin) return;

            if (!target) {
                const next = [...board];
                next[to] = origin;
                next[from] = null;
                setBoard(next);
                notify('Objeto movido.');

                return;
            }

            if (origin.level !== target.level) {
                notify('Solo se fusionan objetos iguales.');

                return;
            }

            const mergedLevel = origin.level;

            if (mergedLevel >= maxMergeItemLevel) {
                notify('Este objeto ya alcanzó su nivel máximo.');

                return;
            }

            const newLevel = Math.min(mergedLevel + 1, maxMergeItemLevel);
            const next = [...board];

            next[to] = makeItem(newLevel);
            next[from] = null;
            setBoard(next);

            triggerFeedback();
            sfx.merge();
            addProgress(mergedLevel);
            setJustMergedCell(to);
            window.setTimeout(() => setJustMergedCell(null), 420);

            const targetCell = document.querySelector(
                `[data-cell-index="${to}"]`,
            );

            if (targetCell) {
                const rect = targetCell.getBoundingClientRect();
                setSparklePosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                });
                window.setTimeout(() => setSparklePosition(null), 750);
            }

            if (
                newLevel >= rules.mergePackMinLevel &&
                Math.random() * 100 < rules.mergePackChancePercent
            ) {
                queuePack(getPack('merge'));
            }
        },
        [
            addProgress,
            board,
            getPack,
            maxMergeItemLevel,
            notify,
            queuePack,
            rules.mergePackChancePercent,
            rules.mergePackMinLevel,
        ],
    );

    const generateItem = useCallback(() => {
        if (energy <= 0) {
            notify('La caja mágica necesita energía.');

            return;
        }

        const firstEmpty = board.findIndex((cell) => !cell);

        if (firstEmpty === -1) {
            notify('El tablero está lleno. Fusiona para abrir espacio.');

            return;
        }

        const next = [...board];
        const generatedLevel =
            Math.random() * 100 < rules.magicBoxBonusChancePercent
                ? rules.magicBoxBonusLevel
                : rules.magicBoxPrimaryLevel;
        const level = Math.min(Math.max(1, generatedLevel), maxMergeItemLevel);
        next[firstEmpty] = makeItem(level);

        setBoard(next);
        setEnergy((value) => value - 1);
        triggerFeedback();
        sfx.magicBox();
        notify('La caja mágica dejó una semilla.');
    }, [
        board,
        energy,
        maxMergeItemLevel,
        notify,
        rules.magicBoxBonusChancePercent,
        rules.magicBoxBonusLevel,
        rules.magicBoxPrimaryLevel,
    ]);

    const buyPack = useCallback(() => {
        const premiumPack = getPack('premium');

        if (hearts < premiumPack.costHearts) {
            notify(
                `Necesitas ${premiumPack.costHearts} corazones para comprar un sobre.`,
            );

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

    const resetBlockGame = useCallback(() => {
        setBlockBoard(emptyBlockBoard());
        setBlockPieces(createBlockPieces());
        setBlockScore(0);
        setBlockCombo(0);
        setSelectedBlockPieceId(null);
        notify('Nuevo tablero de Bloques listo.');
    }, [notify]);

    const placeBlockPiece = useCallback(
        (anchor: number, pieceId = selectedBlockPieceId) => {
            const piece = blockPieces.find((item) => item.id === pieceId);

            if (!piece) {
                notify('Elige una figura y luego toca el tablero.');

                return;
            }

            if (!canPlaceBlock(blockBoard, piece, anchor)) {
                notify('Esa figura no cabe en ese lugar.');

                return;
            }

            const placedBoard = [...blockBoard];
            const placedIndexes = blockPlacementIndexes(piece, anchor);
            placedIndexes.forEach((index) => {
                placedBoard[index] = piece.color;
            });

            const completeRows = Array.from(
                { length: blockBoardSide },
                (_, row) => row,
            ).filter((row) =>
                Array.from(
                    { length: blockBoardSide },
                    (_, column) => placedBoard[row * blockBoardSide + column],
                ).every((cell) => cell > 0),
            );
            const completeColumns = Array.from(
                { length: blockBoardSide },
                (_, column) => column,
            ).filter((column) =>
                Array.from(
                    { length: blockBoardSide },
                    (_, row) => placedBoard[row * blockBoardSide + column],
                ).every((cell) => cell > 0),
            );
            const clearedIndexes = new Set<number>();

            completeRows.forEach((row) => {
                for (let column = 0; column < blockBoardSide; column += 1) {
                    clearedIndexes.add(row * blockBoardSide + column);
                }
            });
            completeColumns.forEach((column) => {
                for (let row = 0; row < blockBoardSide; row += 1) {
                    clearedIndexes.add(row * blockBoardSide + column);
                }
            });

            clearedIndexes.forEach((index) => {
                placedBoard[index] = 0;
            });

            const clearedLines = completeRows.length + completeColumns.length;
            const nextCombo = clearedLines > 0 ? blockCombo + 1 : 0;
            const pieceCells = getBlockShape(piece.shapeId).cells.length;
            const gainedScore =
                pieceCells * 2 + clearedLines * 25 * Math.max(1, nextCombo);
            const nextScore = blockScore + gainedScore;
            const remainingPieces = blockPieces.filter(
                (item) => item.id !== piece.id,
            );

            setBlockBoard(placedBoard);
            setBlockPieces(
                remainingPieces.length > 0
                    ? remainingPieces
                    : createBlockPieces(),
            );
            setBlockScore(nextScore);
            setBlockBest((best) => Math.max(best, nextScore));
            setBlockCombo(nextCombo);
            setSelectedBlockPieceId(null);
            triggerFeedback();

            if (clearedLines > 0) {
                const rewardHearts = clearedLines * 10 * nextCombo;
                setHearts((value) => value + rewardHearts);
                sfx.claim();
                notify(
                    `${clearedLines} línea${clearedLines === 1 ? '' : 's'} · combo x${nextCombo} · +${rewardHearts} corazones.`,
                );
            } else {
                sfx.merge();
                notify(`+${gainedScore} puntos.`);
            }
        },
        [
            blockBoard,
            blockCombo,
            blockPieces,
            blockScore,
            notify,
            selectedBlockPieceId,
        ],
    );

    const handleBlockPointerDown = useCallback(
        (piece: BlockPiece, event: PointerEvent<HTMLButtonElement>) => {
            blockDidDragRef.current = false;
            setSelectedBlockPieceId(piece.id);
            setBlockDrag({
                anchor: blockAnchorFromPointer(
                    piece,
                    event.clientX,
                    event.clientY,
                ),
                piece,
            });
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [],
    );

    const handleBlockPointerMove = useCallback(
        (event: PointerEvent<HTMLButtonElement>) => {
            if (!blockDrag) {
                return;
            }

            blockDidDragRef.current = true;
            const anchor = blockAnchorFromPointer(
                blockDrag.piece,
                event.clientX,
                event.clientY,
            );

            setBlockDrag((drag) =>
                drag
                    ? {
                          ...drag,
                          anchor,
                      }
                    : null,
            );
        },
        [blockDrag],
    );

    const handleBlockPointerEnd = useCallback(() => {
        if (!blockDrag) {
            return;
        }

        if (blockDidDragRef.current) {
            if (blockDrag.anchor !== null) {
                placeBlockPiece(blockDrag.anchor, blockDrag.piece.id);
            }
        }

        setBlockDrag(null);
    }, [blockDrag, placeBlockPiece]);

    const handleMemoryCardClick = useCallback(
        (cardId: string) => {
            if (memoryLocked || flippedMemoryCards.includes(cardId)) {
                return;
            }

            const selectedCard = memoryDeck.find((card) => card.id === cardId);

            if (
                !selectedCard ||
                selectedCard.isMatched ||
                flippedMemoryCards.length >= 2
            ) {
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
                    setMemoryDeck((deck) =>
                        deck.map((card) =>
                            card.pairId === firstCard.pairId
                                ? { ...card, isMatched: true }
                                : card,
                        ),
                    );
                    setMemoryMatches((value) => {
                        const nextMatches = value + 1;

                        if (nextMatches === memorySource.length) {
                            const rewardHearts = 60;
                            const rewardEnergy = 10;

                            setHearts((current) => current + rewardHearts);
                            setEnergy((current) =>
                                Math.min(maxEnergy, current + rewardEnergy),
                            );
                            triggerFeedback();
                            sfx.memoryComplete();
                            setShowConfetti(true);
                            window.setTimeout(
                                () => setShowConfetti(false),
                                2600,
                            );
                            notify(
                                `Memoria completado: +${rewardHearts} corazones y +${rewardEnergy} energía.`,
                            );

                            memoryResetTimerRef.current = window.setTimeout(
                                () => {
                                    setMemoryDeck(createMemoryDeck());
                                    setFlippedMemoryCards([]);
                                    setMemoryMatches(0);
                                    setMemoryMoves(0);
                                    setMemoryLocked(false);
                                    memoryResetTimerRef.current = null;
                                    notify('Nueva ronda de Memoria lista.');
                                },
                                1500,
                            );
                        } else {
                            sfx.memoryMatch();
                            notify(
                                `Pareja encontrada: ${firstCard.item.name}.`,
                            );
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
        },
        [
            createMemoryDeck,
            flippedMemoryCards,
            maxEnergy,
            memoryDeck,
            memoryLocked,
            memorySource.length,
            notify,
        ],
    );

    const claimMission = useCallback(
        (missionId: string) => {
            const mission = missionDefinitions.find(
                (item) => item.id === missionId,
            );

            if (!mission || claimedMissions.includes(mission.id)) {
                return;
            }

            const progress =
                mission.progressKey === 'merge_count'
                    ? mergeCount
                    : mission.progressKey === 'collected_cards'
                      ? collectedCards.length
                      : hearts;

            if (progress < mission.goal) {
                notify('Completa la misión antes de reclamarla.');

                return;
            }

            setClaimedMissions((missions) => [...missions, mission.id]);
            setHearts((value) => value + mission.reward.hearts);
            setEnergy((value) =>
                Math.min(maxEnergy, value + mission.reward.energy),
            );
            triggerFeedback();
            sfx.claim();
            notify(
                `Misión completada: +${mission.reward.hearts} corazones${mission.reward.energy ? ` y +${mission.reward.energy} energía` : ''}.`,
            );
        },
        [
            claimedMissions,
            collectedCards.length,
            hearts,
            maxEnergy,
            mergeCount,
            missionDefinitions,
            notify,
        ],
    );

    const dismissPendingPack = useCallback(() => {
        setPendingPacks((packs) => packs.slice(1));
        setIsPackOpened(false);
        setDismissedPackCards(0);
        setPackCardResults([]);
    }, []);

    const handleCellClick = useCallback(
        (index: number) => {
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
        },
        [mergeCells, selectedCell],
    );

    const handlePointerDown = useCallback(
        (index: number, event: PointerEvent<HTMLButtonElement>) => {
            const item = board[index];

            if (!item) return;

            dragStartRef.current = {
                index,
                x: event.clientX,
                y: event.clientY,
            };
            didPointerDragRef.current = false;
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [board],
    );

    const handlePointerMove = useCallback(
        (event: PointerEvent<HTMLButtonElement>) => {
            const start = dragStartRef.current;

            if (!start) return;

            const item = board[start.index];
            const distance = Math.hypot(
                event.clientX - start.x,
                event.clientY - start.y,
            );

            if (!item || distance < 8) return;

            didPointerDragRef.current = true;
            setTouchDrag({
                index: start.index,
                x: event.clientX,
                y: event.clientY,
                item,
            });
        },
        [board],
    );

    const handlePointerEnd = useCallback(
        (event: PointerEvent<HTMLButtonElement>) => {
            const start = dragStartRef.current;

            if (!start) return;

            if (didPointerDragRef.current) {
                const dropTarget = document
                    .elementFromPoint(event.clientX, event.clientY)
                    ?.closest<HTMLElement>('[data-cell-index]');
                const targetIndex = dropTarget
                    ? Number(dropTarget.dataset.cellIndex)
                    : NaN;

                if (Number.isInteger(targetIndex)) {
                    mergeCells(start.index, targetIndex);
                    setSelectedCell(null);
                }
            }

            dragStartRef.current = null;
            setTouchDrag(null);
        },
        [mergeCells],
    );

    const missions = missionDefinitions.map((mission) => {
        const rawValue =
            mission.progressKey === 'merge_count'
                ? mergeCount
                : mission.progressKey === 'collected_cards'
                  ? collectedCards.length
                  : hearts;

        return {
            ...mission,
            value: Math.min(rawValue, mission.goal),
            completed: rawValue >= mission.goal,
            claimed: claimedMissions.includes(mission.id),
        };
    });
    const memoryProgress =
        memorySource.length > 0
            ? Math.round((memoryMatches / memorySource.length) * 100)
            : 0;
    const selectedBlockPiece =
        blockPieces.find((piece) => piece.id === selectedBlockPieceId) ?? null;
    const blockGameOver =
        blockPieces.length > 0 &&
        !blockPieces.some((piece) => canBlockPieceFit(blockBoard, piece));
    const blockDragIndexes =
        blockDrag?.anchor !== null && blockDrag
            ? blockPlacementIndexes(blockDrag.piece, blockDrag.anchor)
            : [];
    const blockDragCanPlace =
        blockDrag?.anchor !== null && blockDrag
            ? canPlaceBlock(blockBoard, blockDrag.piece, blockDrag.anchor)
            : false;
    const packRevealItems = pendingPack
        ? [
              ...pendingPack.cards.map((card) => ({
                  type: 'card' as const,
                  card,
              })),
              ...(pendingPack.collagePieces ?? []).map((piece) => ({
                  type: 'collage' as const,
                  piece,
              })),
          ]
        : [];

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
                            <img
                                alt="My Home"
                                className="mm-splash__logo"
                                src={logoUrl}
                            />
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
                                <img
                                    alt="My Home"
                                    className="mm-brand__logo"
                                    src={logoUrl}
                                />
                            </div>
                            <div>
                                <h1>My Home</h1>
                            </div>
                        </div>

                        <div className="mm-header__controls">
                            <div className="mm-stats" aria-label="Progreso">
                                <div className="mm-stat">
                                    <Battery size={16} aria-hidden />
                                    <span>{energy}</span>
                                </div>
                                <div className="mm-stat">
                                    <Heart size={16} aria-hidden />
                                    <span>{hearts}</span>
                                </div>
                                <div className="mm-stat">
                                    <Crown size={16} aria-hidden />
                                    <span>{playerLevel}</span>
                                </div>
                            </div>
                            <div className="mm-header__actions">
                                <button
                                    aria-label={
                                        musicPlaying
                                            ? 'Pausar música'
                                            : 'Reproducir música'
                                    }
                                    className={`mm-logout ${musicPlaying ? 'is-playing' : ''}`}
                                    onClick={() => music.toggle()}
                                    title={
                                        musicPlaying
                                            ? 'Pausar música'
                                            : 'Reproducir música'
                                    }
                                    type="button"
                                >
                                    <Music size={17} aria-hidden />
                                </button>
                                <button
                                    aria-label="Cerrar sesión"
                                    className="mm-logout"
                                    onClick={() => router.post('/logout')}
                                    title="Cerrar sesión"
                                    type="button"
                                >
                                    <LogOut size={17} aria-hidden />
                                </button>
                                <button
                                    aria-label="Configuración"
                                    className="mm-logout"
                                    onClick={() =>
                                        router.visit('/settings/profile')
                                    }
                                    title="Configuración"
                                    type="button"
                                >
                                    <Settings size={17} aria-hidden />
                                </button>
                                {auth?.user?.is_admin && (
                                    <button
                                        aria-label="Administración"
                                        className="mm-logout"
                                        onClick={() => router.visit('/admin')}
                                        title="Administración"
                                        type="button"
                                    >
                                        <Crown size={17} aria-hidden />
                                    </button>
                                )}
                                <button
                                    aria-label={
                                        saveStatus === 'error'
                                            ? 'Reintentar guardado'
                                            : saveStatus === 'saving'
                                              ? 'Guardando'
                                              : 'Partida guardada'
                                    }
                                    className={`mm-save-icon mm-save-icon--${saveStatus}`}
                                    disabled={saveStatus !== 'error'}
                                    onClick={() => void postSave(savePayload)}
                                    title={
                                        saveStatus === 'error'
                                            ? 'Reintentar guardado'
                                            : saveStatus === 'saving'
                                              ? 'Guardando'
                                              : 'Partida guardada'
                                    }
                                    type="button"
                                >
                                    {saveStatus === 'error' ||
                                    saveStatus === 'saving' ? (
                                        <RefreshCw size={17} aria-hidden />
                                    ) : (
                                        <Save size={17} aria-hidden />
                                    )}
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="mm-progress">
                        <div className="mm-progress__meta">
                            <span>Nivel {playerLevel}</span>
                            <strong>
                                {xp}/{xpGoal} XP
                            </strong>
                        </div>
                        <div className="mm-progress__track">
                            <span
                                style={{
                                    width: `${Math.min(100, (xp / xpGoal) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>

                    {activeTab === 'merge' && (
                        <section className="mm-stage">
                            <div
                                className="mm-board"
                                aria-label="Tablero de fusión"
                            >
                                {board.map((cell, index) => {
                                    const item = cell
                                        ? getMergeLevel(cell.level)
                                        : null;

                                    return (
                                        <button
                                            className={`mm-cell ${item ? `mm-cell--filled mm-cell--${item.symbol} ${item.imageUrl ? 'mm-cell--image' : ''}` : ''} ${selectedCell === index ? 'is-selected' : ''} ${justMergedCell === index ? 'mm-cell--just-merged' : ''}`}
                                            data-cell-index={index}
                                            draggable={Boolean(cell)}
                                            key={index}
                                            aria-label={
                                                item
                                                    ? `${item.name}, nivel ${item.level}`
                                                    : `Casilla vacía ${index + 1}`
                                            }
                                            onClick={() =>
                                                handleCellClick(index)
                                            }
                                            onDragStart={() =>
                                                setDraggedCell(index)
                                            }
                                            onDragOver={(event) =>
                                                event.preventDefault()
                                            }
                                            onDrop={() => {
                                                if (draggedCell !== null) {
                                                    mergeCells(
                                                        draggedCell,
                                                        index,
                                                    );
                                                    setDraggedCell(null);
                                                }
                                            }}
                                            onPointerCancel={handlePointerEnd}
                                            onPointerDown={(event) =>
                                                handlePointerDown(index, event)
                                            }
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerEnd}
                                            type="button"
                                        >
                                            {item && (
                                                <span
                                                    className={`mm-piece mm-piece--${item.symbol} ${item.imageUrl ? 'has-image' : ''}`}
                                                    style={pieceStyle(item)}
                                                >
                                                    <span className="mm-piece__shine" />
                                                    {item.imageUrl && (
                                                        <img
                                                            alt={item.name}
                                                            className="mm-piece__image"
                                                            src={item.imageUrl}
                                                        />
                                                    )}
                                                    <span className="mm-piece__name">
                                                        {item.name}
                                                    </span>
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
                                        const item = getMergeLevel(
                                            touchDrag.item.level,
                                        );

                                        return (
                                            <span
                                                className={`mm-piece mm-piece--${item.symbol} ${item.imageUrl ? 'has-image' : ''}`}
                                                style={pieceStyle(item)}
                                            >
                                                <span className="mm-piece__shine" />
                                                {item.imageUrl && (
                                                    <img
                                                        alt={item.name}
                                                        className="mm-piece__image"
                                                        src={item.imageUrl}
                                                    />
                                                )}
                                                <span className="mm-piece__name">
                                                    {item.name}
                                                </span>
                                            </span>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="mm-actions">
                                <button
                                    className="mm-magic-box"
                                    disabled={energy <= 0}
                                    onClick={generateItem}
                                    type="button"
                                >
                                    <span className="mm-magic-box__lid" />
                                    <span className="mm-magic-box__body">
                                        <Wand2 size={22} aria-hidden />
                                    </span>
                                    <strong>Caja mágica</strong>
                                    <small>-1 energía</small>
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === 'album' && (
                        <section className="mm-album">
                            <div className="mm-album__summary">
                                <div>
                                    <p className="mm-kicker">Colección</p>
                                    <h2>{albumPercent}% completo</h2>
                                </div>
                                <button onClick={buyPack} type="button">
                                    <PackageOpen size={17} aria-hidden />
                                    <span>{premiumPack.costHearts}</span>
                                </button>
                            </div>

                            <section
                                className="mm-collage"
                                aria-label="Recuerdo secreto"
                            >
                                <div className="mm-collage__head">
                                    <div>
                                        <p className="mm-kicker">
                                            Recuerdo secreto
                                        </p>
                                        <h2>
                                            {activeCollagePhoto
                                                ? `${activeCollageOwnedCount}/${activeCollagePhoto.piecesCount}`
                                                : `0/${totalCollagePieces}`}{' '}
                                            piezas
                                        </h2>
                                    </div>
                                    <span>{collagePercent}%</span>
                                </div>
                                {activeCollagePhoto && (
                                    <div className="mm-collage__nav">
                                        <button
                                            disabled={collagePhotos.length <= 1}
                                            onClick={() =>
                                                setActiveCollageIndex(
                                                    (index) =>
                                                        (index -
                                                            1 +
                                                            collagePhotos.length) %
                                                        collagePhotos.length,
                                                )
                                            }
                                            type="button"
                                        >
                                            <ChevronLeft
                                                size={16}
                                                aria-hidden
                                            />
                                        </button>
                                        <div>
                                            <strong>
                                                {completedPhotoIds.has(
                                                    activeCollagePhoto.id,
                                                )
                                                    ? activeCollagePhoto.label
                                                    : `Recuerdo secreto ${safeActiveCollageIndex + 1}`}
                                            </strong>
                                            <span>
                                                {safeActiveCollageIndex + 1}/
                                                {collagePhotos.length} ·{' '}
                                                {completedPhotoIds.has(
                                                    activeCollagePhoto.id,
                                                )
                                                    ? 'Completo'
                                                    : `${activeCollagePhoto.piecesCount - activeCollageOwnedCount} faltantes`}
                                            </span>
                                        </div>
                                        <button
                                            disabled={collagePhotos.length <= 1}
                                            onClick={() =>
                                                setActiveCollageIndex(
                                                    (index) =>
                                                        (index + 1) %
                                                        collagePhotos.length,
                                                )
                                            }
                                            type="button"
                                        >
                                            <ChevronRight
                                                size={16}
                                                aria-hidden
                                            />
                                        </button>
                                    </div>
                                )}
                                <div
                                    className="mm-collage__grid"
                                    style={
                                        {
                                            '--mm-collage-columns':
                                                collageColumns,
                                            '--mm-collage-rows':
                                                collageRowCount,
                                        } as CSSProperties &
                                            Record<
                                                | '--mm-collage-columns'
                                                | '--mm-collage-rows',
                                                number
                                            >
                                    }
                                >
                                    {collageTiles.map(
                                        ({
                                            column,
                                            imageUrl,
                                            index,
                                            owned,
                                            pieceId,
                                            row,
                                        }) => (
                                            <button
                                                className={`mm-collage__piece ${owned ? 'is-owned' : ''}`}
                                                disabled={!owned}
                                                key={pieceId}
                                                style={
                                                    {
                                                        '--mm-collage-image': `url("${imageUrl}")`,
                                                        '--mm-collage-x': `${(column / (collageColumns - 1)) * 100}%`,
                                                        '--mm-collage-y': `${(row / (collageRowCount - 1)) * 100}%`,
                                                    } as CSSProperties &
                                                        Record<
                                                            | '--mm-collage-image'
                                                            | '--mm-collage-x'
                                                            | '--mm-collage-y',
                                                            string
                                                        >
                                                }
                                                type="button"
                                            >
                                                {!owned && (
                                                    <span>{index + 1}</span>
                                                )}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </section>

                            <div className="mm-album__filters">
                                <button
                                    className={
                                        albumFilter === 'all' ? 'is-active' : ''
                                    }
                                    onClick={() => setAlbumFilter('all')}
                                    type="button"
                                >
                                    Todas{' '}
                                    <span>
                                        {collectedCards.length}/
                                        {cardPool.length}
                                    </span>
                                </button>
                                {(
                                    [
                                        'C',
                                        'R',
                                        'SR',
                                        'SSR',
                                        'UR',
                                        'SECRET',
                                    ] as const
                                ).map((rarity) => {
                                    const stat = rarityStats[rarity];

                                    if (!stat) {
                                        return null;
                                    }

                                    return (
                                        <button
                                            className={`${albumFilter === rarity ? 'is-active' : ''} rarity-${rarity.toLowerCase()}`}
                                            key={rarity}
                                            onClick={() =>
                                                setAlbumFilter(rarity)
                                            }
                                            type="button"
                                        >
                                            {rarity}{' '}
                                            <span>
                                                {stat.owned}/{stat.total}
                                            </span>
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
                                            onClick={() =>
                                                setSelectedAlbumCard(card)
                                            }
                                            type="button"
                                        >
                                            <div className="mm-card__thumb">
                                                {owned ? (
                                                    <img
                                                        alt={card.name}
                                                        src={card.imageUrl}
                                                    />
                                                ) : (
                                                    <span>?</span>
                                                )}
                                            </div>
                                            <div>
                                                <strong>
                                                    {owned
                                                        ? card.name
                                                        : 'Carta oculta'}
                                                </strong>
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
                                {collectedCards.length >= 3 && (
                                    <span className="mm-room__plush" />
                                )}
                                {collectedCards.length >= 6 && (
                                    <span className="mm-room__poster" />
                                )}
                                {collectedCards.length >= 10 && (
                                    <span className="mm-room__cat" />
                                )}
                            </div>

                            <div className="mm-love-letter">
                                <div className="mm-love-letter__header">
                                    <Mail size={17} aria-hidden />
                                    <h2>Carta para ti</h2>
                                    {dailyStreak > 0 && (
                                        <span className="mm-streak">
                                            <span
                                                className="mm-streak__fire"
                                                aria-hidden
                                            >
                                                &#128293;
                                            </span>
                                            {dailyStreak} día
                                            {dailyStreak !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="mm-love-letter__message">
                                    <p>{loveLetterMessages[loveLetterIndex]}</p>
                                </div>
                                <div className="mm-love-letter__nav">
                                    <button
                                        onClick={() => {
                                            sfx.loveLetter();
                                            setLoveLetterIndex(
                                                (i) =>
                                                    (i -
                                                        1 +
                                                        loveLetterMessages.length) %
                                                    loveLetterMessages.length,
                                            );
                                        }}
                                        type="button"
                                    >
                                        <ChevronLeft size={18} aria-hidden />
                                    </button>
                                    <button
                                        onClick={() => {
                                            sfx.loveLetter();
                                            setLoveLetterIndex(
                                                (i) =>
                                                    (i + 1) %
                                                    loveLetterMessages.length,
                                            );
                                        }}
                                        type="button"
                                    >
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
                                    <div
                                        className="mm-mission"
                                        key={mission.label}
                                    >
                                        <div className="mm-mission__meta">
                                            <span>{mission.label}</span>
                                            <strong>
                                                {mission.value}/{mission.goal}
                                            </strong>
                                        </div>
                                        <div className="mm-mission__track">
                                            <span
                                                style={{
                                                    width: `${(mission.value / mission.goal) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <button
                                            className="mm-mission__claim"
                                            disabled={
                                                !mission.completed ||
                                                mission.claimed
                                            }
                                            onClick={() =>
                                                claimMission(mission.id)
                                            }
                                            type="button"
                                        >
                                            {mission.claimed
                                                ? 'Reclamada'
                                                : mission.completed
                                                  ? `Reclamar +${mission.reward.hearts}`
                                                  : `Recompensa +${mission.reward.hearts}`}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeTab === 'blocks' && (
                        <section className="mm-blocks">
                            <div className="mm-blocks__summary">
                                <div>
                                    <p className="mm-kicker">Bloques de amor</p>
                                    <h2>{blockScore} puntos</h2>
                                </div>
                                <div className="mm-blocks__records">
                                    <span>Récord {blockBest}</span>
                                    <span>
                                        {blockCombo > 0
                                            ? `Combo x${blockCombo}`
                                            : 'Sin combo'}
                                    </span>
                                </div>
                                <button
                                    aria-label="Reiniciar Bloques"
                                    onClick={resetBlockGame}
                                    type="button"
                                >
                                    <RotateCcw size={17} aria-hidden />
                                </button>
                            </div>

                            <div
                                className={`mm-blocks__board ${blockGameOver ? 'is-over' : ''}`}
                                aria-label="Tablero de Bloques"
                            >
                                {blockBoard.map((cell, index) => {
                                    return (
                                        <button
                                            aria-label={`Casilla ${index + 1}${cell ? ' ocupada' : ' vacía'}`}
                                            className={`${cell ? `is-filled color-${cell}` : ''} ${blockDragCanPlace && blockDragIndexes.includes(index) ? `is-drop-preview color-${blockDrag?.piece.color ?? 1}` : ''}`}
                                            data-block-index={index}
                                            disabled={blockGameOver}
                                            key={index}
                                            onClick={() =>
                                                placeBlockPiece(index)
                                            }
                                            type="button"
                                        />
                                    );
                                })}
                                {blockGameOver && (
                                    <div className="mm-blocks__game-over">
                                        <Boxes size={28} aria-hidden />
                                        <strong>Sin movimientos</strong>
                                        <span>
                                            Lograste {blockScore} puntos
                                        </span>
                                        <button
                                            onClick={resetBlockGame}
                                            type="button"
                                        >
                                            Jugar otra vez
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="mm-blocks__hint">
                                {blockDrag
                                    ? blockDragCanPlace
                                        ? 'Suelta: la figura caerá en las casillas iluminadas.'
                                        : 'Sigue moviendo el dedo hasta que aparezca la figura.'
                                    : selectedBlockPiece
                                      ? 'Toca una casilla o arrastra la figura al tablero.'
                                      : 'Arrastra una figura; tu dedo puede quedarse debajo del tablero.'}
                            </p>

                            <div
                                className="mm-blocks__pieces"
                                aria-label="Figuras disponibles"
                            >
                                {blockPieces.map((piece) => {
                                    const shape = getBlockShape(piece.shapeId);
                                    const occupied = new Set(
                                        shape.cells.map(
                                            ([row, column]) =>
                                                `${row}:${column}`,
                                        ),
                                    );

                                    return (
                                        <button
                                            aria-label="Seleccionar figura"
                                            className={`${selectedBlockPieceId === piece.id ? 'is-selected' : ''} ${blockDrag?.piece.id === piece.id ? 'is-dragging' : ''} ${canBlockPieceFit(blockBoard, piece) ? '' : 'cannot-fit'}`}
                                            key={piece.id}
                                            onClick={() => {
                                                if (blockDidDragRef.current) {
                                                    blockDidDragRef.current = false;

                                                    return;
                                                }

                                                setSelectedBlockPieceId(
                                                    piece.id,
                                                );
                                            }}
                                            onPointerCancel={
                                                handleBlockPointerEnd
                                            }
                                            onPointerDown={(event) =>
                                                handleBlockPointerDown(
                                                    piece,
                                                    event,
                                                )
                                            }
                                            onPointerMove={
                                                handleBlockPointerMove
                                            }
                                            onPointerUp={handleBlockPointerEnd}
                                            type="button"
                                        >
                                            <span className="mm-blocks__piece-grid">
                                                {Array.from(
                                                    { length: 16 },
                                                    (_, cellIndex) => {
                                                        const row = Math.floor(
                                                            cellIndex / 4,
                                                        );
                                                        const column =
                                                            cellIndex % 4;
                                                        const filled =
                                                            occupied.has(
                                                                `${row}:${column}`,
                                                            );

                                                        return (
                                                            <span
                                                                className={
                                                                    filled
                                                                        ? `is-filled color-${piece.color}`
                                                                        : ''
                                                                }
                                                                key={cellIndex}
                                                            />
                                                        );
                                                    },
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mm-blocks__reward">
                                <Heart size={15} aria-hidden />
                                <span>
                                    Cada línea entrega corazones; los combos
                                    multiplican el premio.
                                </span>
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

                            <div
                                className="mm-memory__board"
                                aria-label="Tablero de Memoria"
                            >
                                {memoryDeck.map((card) => {
                                    const isFlipped =
                                        flippedMemoryCards.includes(card.id) ||
                                        card.isMatched;

                                    return (
                                        <button
                                            className={`mm-memory-card ${isFlipped ? 'is-flipped' : ''} ${card.isMatched ? 'is-matched' : ''}`}
                                            disabled={
                                                memoryLocked || card.isMatched
                                            }
                                            key={card.id}
                                            onClick={() =>
                                                handleMemoryCardClick(card.id)
                                            }
                                            type="button"
                                        >
                                            <span className="mm-memory-card__back">
                                                <Brain size={22} aria-hidden />
                                            </span>
                                            <span className="mm-memory-card__front">
                                                <span
                                                    className={`mm-piece mm-piece--${card.item.symbol} ${card.item.imageUrl ? 'has-image' : ''}`}
                                                    style={pieceStyle(
                                                        card.item,
                                                    )}
                                                >
                                                    <span className="mm-piece__shine" />
                                                    {card.item.imageUrl && (
                                                        <img
                                                            alt={card.item.name}
                                                            className="mm-piece__image"
                                                            src={
                                                                card.item
                                                                    .imageUrl
                                                            }
                                                        />
                                                    )}
                                                    <span className="mm-piece__name">
                                                        {card.item.name}
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mm-memory__rewards">
                                <span>
                                    {memoryMatches}/{memorySource.length}{' '}
                                    parejas
                                </span>
                                <span>+60 corazones</span>
                                <span>+10 energía</span>
                            </div>

                            {memoryMatches === memorySource.length &&
                                memorySource.length > 0 && (
                                    <div className="mm-memory-complete">
                                        <h3>Todas las parejas encontradas</h3>
                                        <p>
                                            Recompensas reclamadas. Preparando
                                            nueva ronda...
                                        </p>
                                    </div>
                                )}
                        </section>
                    )}

                    <nav className="mm-tabs" aria-label="Vistas">
                        <button
                            className={activeTab === 'merge' ? 'is-active' : ''}
                            onClick={() => setActiveTab('merge')}
                            type="button"
                        >
                            <Wand2 size={19} aria-hidden />
                            <span>Merge</span>
                        </button>
                        <button
                            className={
                                activeTab === 'blocks' ? 'is-active' : ''
                            }
                            onClick={() => setActiveTab('blocks')}
                            type="button"
                        >
                            <Boxes size={19} aria-hidden />
                            <span>Bloques</span>
                        </button>
                        <button
                            className={
                                activeTab === 'memory' ? 'is-active' : ''
                            }
                            onClick={() => setActiveTab('memory')}
                            type="button"
                        >
                            <Brain size={19} aria-hidden />
                            <span>Memoria</span>
                        </button>
                        <button
                            className={activeTab === 'album' ? 'is-active' : ''}
                            onClick={() => setActiveTab('album')}
                            type="button"
                        >
                            <Album size={19} aria-hidden />
                            <span>Album</span>
                        </button>
                        <button
                            className={activeTab === 'room' ? 'is-active' : ''}
                            onClick={() => setActiveTab('room')}
                            type="button"
                        >
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
                        <div
                            className="mm-daily-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Recompensa diaria"
                        >
                            <div className="mm-daily-modal__panel">
                                <span className="mm-daily-modal__icon">
                                    <Gift size={28} aria-hidden />
                                </span>
                                <p className="mm-kicker">Recompensa diaria</p>
                                <h2>Regalo listo</h2>
                                {dailyStreak > 0 && (
                                    <span className="mm-streak">
                                        <span
                                            className="mm-streak__fire"
                                            aria-hidden
                                        >
                                            &#128293;
                                        </span>
                                        Racha: {dailyStreak} día
                                        {dailyStreak !== 1 ? 's' : ''} seguidos
                                    </span>
                                )}
                                <div className="mm-daily-modal__rewards">
                                    <span>+{dailyReward.energy} energía</span>
                                    <span>+{dailyReward.hearts} corazones</span>
                                    <span>Sobre diario</span>
                                </div>
                                <button
                                    onClick={claimDailyReward}
                                    type="button"
                                >
                                    Reclamar
                                </button>
                                <button
                                    className="mm-daily-modal__later"
                                    onClick={() => setShowDailyReward(false)}
                                    type="button"
                                >
                                    Luego
                                </button>
                            </div>
                        </div>
                    )}

                    {pendingPack && (
                        <div
                            className="mm-pack-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-label={pendingPack.label}
                        >
                            <div className="mm-pack-modal__panel">
                                {!isPackOpened ? (
                                    <>
                                        <button
                                            className="mm-envelope"
                                            disabled={!assetsReady}
                                            onClick={revealPendingPack}
                                            type="button"
                                        >
                                            <img
                                                alt={pendingPack.label}
                                                src={packImageUrl}
                                            />
                                            <span className="mm-envelope__cut">
                                                <Scissors
                                                    size={18}
                                                    aria-hidden
                                                />
                                            </span>
                                        </button>
                                        <p>
                                            {assetsReady
                                                ? 'Presiona la tijera para cortar el sobre.'
                                                : 'Preparando cartas...'}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        {dismissedPackCards <
                                        packRevealItems.length ? (
                                            <button
                                                className="mm-card-stack"
                                                onClick={advancePackCard}
                                                type="button"
                                            >
                                                {packRevealItems.map(
                                                    (reward, index) => {
                                                        const revealState =
                                                            index <
                                                            dismissedPackCards
                                                                ? 'is-dismissed'
                                                                : index ===
                                                                    dismissedPackCards
                                                                  ? 'is-active'
                                                                  : 'is-waiting';
                                                        const stackStyle = {
                                                            '--stack-index':
                                                                index,
                                                        } as CSSProperties &
                                                            Record<
                                                                '--stack-index',
                                                                number
                                                            >;

                                                        if (
                                                            reward.type ===
                                                            'collage'
                                                        ) {
                                                            return (
                                                                <span
                                                                    className={`mm-stack-card mm-stack-card--collage ${revealState}`}
                                                                    key={`${pendingPack.id}-stack-${reward.piece.id}-${index}`}
                                                                    style={{
                                                                        ...stackStyle,
                                                                        ...collagePieceStyle(
                                                                            reward.piece,
                                                                        ),
                                                                    }}
                                                                >
                                                                    <div className="mm-reward-card__piece-bg" />
                                                                    <small>
                                                                        Pieza
                                                                    </small>
                                                                    <strong>
                                                                        Pieza
                                                                        secreta
                                                                    </strong>
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <span
                                                                className={`mm-stack-card rarity-${reward.card.rarity.toLowerCase()} ${revealState}`}
                                                                key={`${pendingPack.id}-stack-${reward.card.id}-${index}`}
                                                                style={
                                                                    stackStyle
                                                                }
                                                            >
                                                                <img
                                                                    alt={
                                                                        reward
                                                                            .card
                                                                            .name
                                                                    }
                                                                    src={
                                                                        reward
                                                                            .card
                                                                            .imageUrl
                                                                    }
                                                                />
                                                                <small>
                                                                    {
                                                                        reward
                                                                            .card
                                                                            .rarity
                                                                    }
                                                                </small>
                                                            </span>
                                                        );
                                                    },
                                                )}
                                            </button>
                                        ) : (
                                            <>
                                                <div className="mm-pack-modal__cards">
                                                    {pendingPack.cards.map(
                                                        (card, index) => {
                                                            const result =
                                                                packCardResults[
                                                                    index
                                                                ];

                                                            return (
                                                                <div
                                                                    className={`mm-reward-card rarity-${card.rarity.toLowerCase()} ${result?.status === 'new' ? 'is-new' : 'is-duplicate'}`}
                                                                    key={`${pendingPack.id}-${card.id}-${index}`}
                                                                >
                                                                    <img
                                                                        alt={
                                                                            card.name
                                                                        }
                                                                        src={
                                                                            card.imageUrl
                                                                        }
                                                                    />
                                                                    <span>
                                                                        {
                                                                            card.rarity
                                                                        }
                                                                    </span>
                                                                    {result && (
                                                                        <em>
                                                                            {result.status ===
                                                                            'new'
                                                                                ? 'Nueva'
                                                                                : `Duplicada +${result.bonusHearts}`}
                                                                        </em>
                                                                    )}
                                                                    <strong>
                                                                        {
                                                                            card.name
                                                                        }
                                                                    </strong>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                    {(
                                                        pendingPack.collagePieces ??
                                                        []
                                                    ).map((piece) => (
                                                        <div
                                                            className="mm-reward-card mm-reward-card--collage is-new"
                                                            key={`${pendingPack.id}-${piece.id}`}
                                                            style={collagePieceStyle(
                                                                piece,
                                                            )}
                                                        >
                                                            <div className="mm-reward-card__piece-bg" />
                                                            <span>Pieza</span>
                                                            <em>Nueva</em>
                                                            <strong>
                                                                Pieza secreta
                                                            </strong>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    className="mm-pack-modal__close"
                                                    onClick={dismissPendingPack}
                                                    type="button"
                                                >
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
                        <div
                            className="mm-card-viewer"
                            role="dialog"
                            aria-modal="true"
                            aria-label={selectedAlbumCard.name}
                        >
                            <div
                                className={`mm-card-viewer__panel rarity-${selectedAlbumCard.rarity.toLowerCase()}`}
                            >
                                <img
                                    alt={selectedAlbumCard.name}
                                    src={selectedAlbumCard.imageUrl}
                                />
                                <div className="mm-card-viewer__meta">
                                    <span>{selectedAlbumCard.rarity}</span>
                                    <strong>{selectedAlbumCard.name}</strong>
                                    <p>{selectedAlbumCard.collection}</p>
                                </div>
                                <button
                                    className="mm-card-viewer__close"
                                    onClick={() => setSelectedAlbumCard(null)}
                                    type="button"
                                >
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
                        <div
                            className="mm-sparkle-burst"
                            aria-hidden
                            style={{
                                left: sparklePosition.x,
                                top: sparklePosition.y,
                            }}
                        >
                            {Array.from({ length: 8 }, (_, i) => (
                                <span
                                    className="mm-sparkle-burst__particle"
                                    key={i}
                                />
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
