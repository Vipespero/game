import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Album,
    Battery,
    Crown,
    Gift,
    Heart,
    LogOut,
    PackageOpen,
    Scissors,
    Settings,
    Sparkles,
    Trophy,
    Wand2,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import packImageUrl from '../../assets/sanrio_pack.png?url';

type BoardItem = {
    id: string;
    level: number;
};

type CardRarity = 'C' | 'R' | 'SR' | 'SSR' | 'UR' | 'SECRET';

type MelodyCard = {
    id: string;
    name: string;
    collection: string;
    rarity: CardRarity;
    flavor: string;
    imagePath: string;
    imageUrl: string;
    dropWeight: number;
    isActive: boolean;
};

type MergeItemDefinition = {
    level: number;
    name: string;
    symbol: string;
    imagePath: string | null;
    imageUrl: string;
    backgroundStyle: string | null;
    borderRadius: string;
    imageSize: number;
    imageOffsetX: number;
    imageOffsetY: number;
    xp: number;
    hearts: number;
    isActive: boolean;
};

type MergeItemSource = Omit<MergeItemDefinition, 'imageUrl'>;

type CardRarityDefinition = {
    code: CardRarity;
    name: string;
    duplicateHearts: number;
    sortOrder: number;
    isActive: boolean;
};

type GameConfig = {
    maxEnergy: number;
    dailyRewardEnergy: number;
    dailyRewardHearts: number;
};

type GameRules = {
    magicBoxPrimaryLevel: number;
    magicBoxBonusLevel: number;
    magicBoxBonusChancePercent: number;
    mergePackMinLevel: number;
    mergePackChancePercent: number;
};

type GamePackDefinition = {
    id: string;
    label: string;
    triggerKey: 'premium' | 'daily' | 'level' | 'merge';
    costHearts: number;
    cardsCount: number;
    sortOrder?: number;
    isActive?: boolean;
};

type MissionDefinition = {
    id: string;
    label: string;
    progressKey: 'merge_count' | 'collected_cards' | 'hearts';
    goal: number;
    reward: {
        hearts: number;
        energy: number;
    };
    sortOrder?: number;
    isActive?: boolean;
};

type PlayerLevelDefinition = {
    level: number;
    xpRequired: number;
    rewardEnergy: number;
    rewardPackTrigger: GamePackDefinition['triggerKey'] | null;
    isActive: boolean;
};

type PackReward = {
    id: string;
    label: string;
    cards: MelodyCard[];
};

type PackCardResult = {
    status: 'new' | 'duplicate';
    bonusHearts: number;
};

type SavedPackReward = {
    id: string;
    label: string;
    cards: string[];
};

type MelodyGameSave = {
    board?: Array<BoardItem | null>;
    energy?: number;
    hearts?: number;
    xp?: number;
    playerLevel?: number;
    mergeCount?: number;
    openedPacks?: SavedPackReward[];
    activeTab?: 'merge' | 'album' | 'room';
    claimedMissions?: string[];
    dailyRewardClaimedAt?: string | null;
    lastSeenAt?: string | null;
};

type MelodyMergePageProps = {
    cards: Array<Omit<MelodyCard, 'imageUrl'>>;
    cardRarities?: CardRarityDefinition[];
    gameConfig?: GameConfig;
    gamePacks?: GamePackDefinition[];
    gameRules?: GameRules;
    mergeItems?: MergeItemSource[];
    missions?: MissionDefinition[];
    playerLevels?: PlayerLevelDefinition[];
    gameSave?: MelodyGameSave | null;
    auth?: {
        user?: {
            is_admin?: boolean;
            name?: string;
        } | null;
    };
};

const boardSize = 25;
const fallbackGameConfig: GameConfig = {
    maxEnergy: 100,
    dailyRewardEnergy: 30,
    dailyRewardHearts: 120,
};

const fallbackGameRules: GameRules = {
    magicBoxPrimaryLevel: 1,
    magicBoxBonusLevel: 2,
    magicBoxBonusChancePercent: 18,
    mergePackMinLevel: 5,
    mergePackChancePercent: 8,
};

const fallbackMissions: MissionDefinition[] = [
    { id: 'merge-20', label: 'Fusiona 20 objetos', progressKey: 'merge_count', goal: 20, reward: { hearts: 80, energy: 10 } },
    { id: 'album-5', label: 'Colecciona 5 cartas', progressKey: 'collected_cards', goal: 5, reward: { hearts: 120, energy: 15 } },
    { id: 'hearts-500', label: 'Guarda 500 corazones', progressKey: 'hearts', goal: 500, reward: { hearts: 160, energy: 0 } },
];

const fallbackGamePacks: GamePackDefinition[] = [
    { id: 'premium', label: 'Sobre premium', triggerKey: 'premium', costHearts: 180, cardsCount: 3 },
    { id: 'daily', label: 'Sobre diario', triggerKey: 'daily', costHearts: 0, cardsCount: 3 },
    { id: 'level', label: 'Sobre de nivel', triggerKey: 'level', costHearts: 0, cardsCount: 3 },
    { id: 'merge', label: 'Sobre por fusion', triggerKey: 'merge', costHearts: 0, cardsCount: 3 },
];

const fallbackDuplicateHeartRewards: Record<CardRarity, number> = {
    C: 8,
    R: 18,
    SR: 34,
    SSR: 62,
    UR: 110,
    SECRET: 180,
};

const mergeChain: MergeItemSource[] = [
    { level: 1, name: 'Semilla', symbol: 'seed', imagePath: 'Melody1.png', backgroundStyle: 'linear-gradient(145deg, #ff9696, #e73b3b)', borderRadius: '50%', imageSize: 86, imageOffsetX: 0, imageOffsetY: 8, xp: 6, hearts: 1, isActive: true },
    { level: 2, name: 'Flor', symbol: 'flower', imagePath: 'pompompurin.png', backgroundStyle: 'linear-gradient(145deg, #ffe79d, #ffba54)', borderRadius: '50%', imageSize: 88, imageOffsetX: 0, imageOffsetY: 0, xp: 10, hearts: 2, isActive: true },
    { level: 3, name: 'Ramo', symbol: 'bouquet', imagePath: 'Mymelodyrosa.png', backgroundStyle: 'linear-gradient(145deg, #ffd8ee, #ff74b8)', borderRadius: '50%', imageSize: 76, imageOffsetX: 0, imageOffsetY: 6, xp: 16, hearts: 4, isActive: true },
    { level: 4, name: 'Peluche', symbol: 'plush', imagePath: 'cinamoom.png', backgroundStyle: 'linear-gradient(145deg, #d8f4ff, #76cbff)', borderRadius: '50%', imageSize: 92, imageOffsetX: 0, imageOffsetY: 4, xp: 26, hearts: 7, isActive: true },
    { level: 5, name: 'Lazo', symbol: 'bow', imagePath: 'bibble.png', backgroundStyle: 'linear-gradient(145deg, #ff76bf, #cf4cf0)', borderRadius: '18px', imageSize: 92, imageOffsetX: 0, imageOffsetY: 0, xp: 42, hearts: 11, isActive: true },
    { level: 6, name: 'Corona', symbol: 'crown', imagePath: 'pochaco.png', backgroundStyle: 'linear-gradient(145deg, #ffd971, #f3a522)', borderRadius: '18px', imageSize: 90, imageOffsetX: 0, imageOffsetY: 2, xp: 68, hearts: 18, isActive: true },
    { level: 7, name: 'Tesoro', symbol: 'gem', imagePath: 'bibble.png', backgroundStyle: 'linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', borderRadius: '18px', imageSize: 92, imageOffsetX: 0, imageOffsetY: 0, xp: 108, hearts: 28, isActive: true },
    { level: 8, name: 'Castillo', symbol: 'castle', imagePath: 'pochaco.png', backgroundStyle: 'linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', borderRadius: '18px', imageSize: 90, imageOffsetX: 0, imageOffsetY: 2, xp: 166, hearts: 42, isActive: true },
    { level: 9, name: 'Palacio', symbol: 'palace', imagePath: 'bibble.png', backgroundStyle: 'linear-gradient(145deg, #f8b7ff, #8b5cf6 55%, #65d7ff)', borderRadius: '18px', imageSize: 92, imageOffsetX: 0, imageOffsetY: 0, xp: 248, hearts: 62, isActive: true },
    { level: 10, name: 'Legendario', symbol: 'rainbow', imagePath: 'pochaco.png', backgroundStyle: 'linear-gradient(145deg, #ffe66d, #ff78bd 52%, #8b5cf6)', borderRadius: '18px', imageSize: 90, imageOffsetX: 0, imageOffsetY: 2, xp: 360, hearts: 90, isActive: true },
    { level: 11, name: 'Estrella', symbol: 'star', imagePath: 'maria.png', backgroundStyle: 'linear-gradient(145deg, #fff1a8, #ff7ab6 55%, #9d77ff)', borderRadius: '20px', imageSize: 94, imageOffsetX: 0, imageOffsetY: 0, xp: 510, hearts: 128, isActive: true },
    { level: 12, name: 'Cometa', symbol: 'comet', imagePath: 'Fresa.png', backgroundStyle: 'linear-gradient(145deg, #b8f4ff, #7c83ff 52%, #ff92d0)', borderRadius: '20px', imageSize: 92, imageOffsetX: 0, imageOffsetY: 2, xp: 706, hearts: 178, isActive: true },
    { level: 13, name: 'Nube', symbol: 'cloud', imagePath: 'maria.png', backgroundStyle: 'linear-gradient(145deg, #fef3ff, #a5d8ff 52%, #f0abfc)', borderRadius: '22px', imageSize: 94, imageOffsetX: 0, imageOffsetY: 0, xp: 958, hearts: 240, isActive: true },
    { level: 14, name: 'Campana', symbol: 'bell', imagePath: 'Fresa.png', backgroundStyle: 'linear-gradient(145deg, #fff0a6, #ffbd59 52%, #ff7ab6)', borderRadius: '22px', imageSize: 92, imageOffsetX: 0, imageOffsetY: 2, xp: 1278, hearts: 320, isActive: true },
    { level: 15, name: 'Cupcake', symbol: 'cupcake', imagePath: 'maria.png', backgroundStyle: 'linear-gradient(145deg, #ffd6e8, #ff8cc6 52%, #b794f4)', borderRadius: '24px', imageSize: 94, imageOffsetX: 0, imageOffsetY: 0, xp: 1680, hearts: 420, isActive: true },
    { level: 16, name: 'Diamante', symbol: 'diamond', imagePath: 'Fresa.png', backgroundStyle: 'linear-gradient(145deg, #9ff3ff, #77a7ff 52%, #d68cff)', borderRadius: '24px', imageSize: 92, imageOffsetX: 0, imageOffsetY: 2, xp: 2182, hearts: 546, isActive: true },
    { level: 17, name: 'Jardin', symbol: 'garden', imagePath: 'maria.png', backgroundStyle: 'linear-gradient(145deg, #c7ffd8, #72d6a4 52%, #ff99cf)', borderRadius: '26px', imageSize: 94, imageOffsetX: 0, imageOffsetY: 0, xp: 2804, hearts: 702, isActive: true },
    { level: 18, name: 'Sueño', symbol: 'dream', imagePath: 'Fresa.png', backgroundStyle: 'linear-gradient(145deg, #d7c6ff, #8b5cf6 52%, #ff8cc6)', borderRadius: '26px', imageSize: 92, imageOffsetX: 0, imageOffsetY: 2, xp: 3570, hearts: 892, isActive: true },
    { level: 19, name: 'Reino', symbol: 'kingdom', imagePath: 'maria.png', backgroundStyle: 'linear-gradient(145deg, #ffe7a8, #ff87c2 48%, #7dd3fc)', borderRadius: '28px', imageSize: 94, imageOffsetX: 0, imageOffsetY: 0, xp: 4508, hearts: 1128, isActive: true },
    { level: 20, name: 'Final', symbol: 'final', imagePath: 'Fresa.png', backgroundStyle: 'linear-gradient(145deg, #fff1a8, #ff78bd 42%, #8b5cf6 72%, #65d7ff)', borderRadius: '28px', imageSize: 92, imageOffsetX: 0, imageOffsetY: 2, xp: 5650, hearts: 1412, isActive: true },
];

const assetImages = import.meta.glob('../../assets/**/*.png', {
    eager: true,
    import: 'default',
    query: '?url',
}) as Record<string, string>;

const getAssetImage = (file?: string | null) => {
    if (!file) {
        return '';
    }

    if (file.startsWith('http') || file.startsWith('/')) {
        return file;
    }

    return assetImages[`../../assets/${file}`] ?? '';
};

const getCardImage = (file: string) => {
    if (file.startsWith('http') || file.startsWith('/')) {
        return file;
    }

    return getAssetImage(`cards/${file}`);
};

const emptyBoard = (): Array<BoardItem | null> => Array.from({ length: boardSize }, () => null);

const fallbackMergeItems: MergeItemDefinition[] = mergeChain.map((item) => ({
    ...item,
    imageUrl: getAssetImage(item.imagePath),
}));

const getLevel = (level: number, items: MergeItemDefinition[] = fallbackMergeItems) =>
    items.find((item) => item.level === level) ?? (fallbackMergeItems[Math.min(Math.max(level, 1), fallbackMergeItems.length) - 1] as MergeItemDefinition);

const pieceStyle = (item: MergeItemDefinition): CSSProperties => ({
    background: item.backgroundStyle || undefined,
    borderRadius: item.borderRadius || undefined,
    '--mm-piece-image-size': `${item.imageSize || 86}%`,
    '--mm-piece-image-x': `${item.imageOffsetX || 0}%`,
    '--mm-piece-image-y': `${item.imageOffsetY || 0}%`,
} as CSSProperties);

const xpForLevel = (level: number) => Math.round(60 + (level - 1) * 110 + Math.pow(level - 1, 2) * 35);

const fallbackPlayerLevels: PlayerLevelDefinition[] = Array.from({ length: 100 }, (_, index) => ({
    level: index + 1,
    xpRequired: xpForLevel(index + 1),
    rewardEnergy: 20,
    rewardPackTrigger: 'level',
    isActive: true,
}));

const chooseCard = (cardPool: MelodyCard[]): MelodyCard | null => {
    if (cardPool.length === 0) {
        return null;
    }

    const activeCards = cardPool.filter((card) => card.isActive);

    if (activeCards.length === 0) {
        return null;
    }

    const totalWeight = activeCards.reduce((total, card) => total + Math.max(card.dropWeight, 1), 0);
    let roll = Math.random() * totalWeight;

    for (const card of activeCards) {
        roll -= Math.max(card.dropWeight, 1);

        if (roll <= 0) {
            return card;
        }
    }

    return activeCards[0];
};

const makeItem = (level = 1): BoardItem => ({
    id: nanoid(),
    level,
});

const defaultBoard = () => {
    const next = emptyBoard();
    next[7] = makeItem(1);
    next[12] = makeItem(1);
    next[17] = makeItem(2);
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
    return tab === 'album' || tab === 'room' || tab === 'merge' ? tab : 'merge';
};

const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);

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

const triggerFeedback = () => {
    if ('vibrate' in navigator) {
        navigator.vibrate(18);
    }
};

export default function MelodyMergePage({
    cards,
    cardRarities = [],
    gameConfig,
    gamePacks = [],
    gameRules,
    mergeItems = [],
    missions: configuredMissions = [],
    playerLevels = [],
    gameSave,
    auth,
}: MelodyMergePageProps) {
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
    const savedEnergy = Math.min(Math.max(gameSave?.energy ?? 84, 0), maxEnergy);
    const offlineEnergyGain = getOfflineEnergyGain(gameSave?.lastSeenAt, savedEnergy, maxEnergy);
    const [board, setBoard] = useState<Array<BoardItem | null>>(() => normalizeBoard(gameSave?.board));
    const [energy, setEnergy] = useState(Math.min(savedEnergy + offlineEnergyGain, maxEnergy));
    const [hearts, setHearts] = useState(Math.max(gameSave?.hearts ?? 120, 0));
    const [xp, setXp] = useState(Math.max(gameSave?.xp ?? 0, 0));
    const [playerLevel, setPlayerLevel] = useState(Math.max(gameSave?.playerLevel ?? 1, 1));
    const [mergeCount, setMergeCount] = useState(Math.max(gameSave?.mergeCount ?? 0, 0));
    const [openedPacks, setOpenedPacks] = useState<PackReward[]>(() => normalizePacks(cardsById, gameSave?.openedPacks));
    const [claimedMissions, setClaimedMissions] = useState<string[]>(() => gameSave?.claimedMissions ?? []);
    const [dailyRewardClaimedAt, setDailyRewardClaimedAt] = useState<string | null>(gameSave?.dailyRewardClaimedAt ?? null);
    const [showDailyReward, setShowDailyReward] = useState(() => canClaimDailyReward(gameSave?.dailyRewardClaimedAt));
    const [pendingPack, setPendingPack] = useState<PackReward | null>(null);
    const [selectedAlbumCard, setSelectedAlbumCard] = useState<MelodyCard | null>(null);
    const [isPackOpened, setIsPackOpened] = useState(false);
    const [dismissedPackCards, setDismissedPackCards] = useState(0);
    const [packCardResults, setPackCardResults] = useState<PackCardResult[]>([]);
    const [assetsReady, setAssetsReady] = useState(false);
    const [selectedCell, setSelectedCell] = useState<number | null>(null);
    const [draggedCell, setDraggedCell] = useState<number | null>(null);
    const [touchDrag, setTouchDrag] = useState<{
        index: number;
        x: number;
        y: number;
        item: BoardItem;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<'merge' | 'album' | 'room'>(() => normalizeTab(gameSave?.activeTab));
    const [toastMessage, setToastMessage] = useState(
        offlineEnergyGain > 0
            ? `Recuperaste ${offlineEnergyGain} energia mientras no estabas.`
            : `Hola ${auth?.user?.name ?? 'jugador'}, tu partida se guarda sola.`,
    );
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const dragStartRef = useRef<{ index: number; x: number; y: number } | null>(null);
    const didPointerDragRef = useRef(false);
    const didMountSaveRef = useRef(offlineEnergyGain > 0);
    const saveTimerRef = useRef<number | null>(null);

    const notify = useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    const postSave = useCallback((state: MelodyGameSave, keepalive = false) => {
        const body = JSON.stringify({ state });

        setSaveStatus('saving');

        return fetch('/melody/save', {
            method: 'PUT',
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

    useEffect(() => {
        const timer = window.setInterval(() => {
            setEnergy((value) => Math.min(maxEnergy, value + 1));
        }, 60000);

        return () => window.clearInterval(timer);
    }, [maxEnergy]);

    useEffect(() => {
        if (!toastMessage) return;

        const timer = window.setTimeout(() => setToastMessage(''), 2600);
        return () => window.clearTimeout(timer);
    }, [toastMessage]);

    useEffect(() => {
        let cancelled = false;
        const urls = [
            packImageUrl,
            ...cardPool.map((card) => card.imageUrl),
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
    }, [cardPool, mergeItemPool]);

    const collectedCards = useMemo(() => {
        const unique = new Map<string, MelodyCard>();
        openedPacks.forEach((pack) => pack.cards.forEach((card) => unique.set(card.id, card)));
        return [...unique.values()];
    }, [openedPacks]);

    const xpGoal = getPlayerLevel(playerLevel).xpRequired;
    const albumPercent = cardPool.length > 0 ? Math.round((collectedCards.length / cardPool.length) * 100) : 0;
    const freeCells = board.filter((cell) => !cell).length;
    const savePayload = useMemo<MelodyGameSave>(() => ({
        board,
        energy,
        hearts,
        xp,
        playerLevel,
        mergeCount,
        openedPacks: openedPacks.map((pack) => ({
            id: pack.id,
            label: pack.label,
            cards: pack.cards.map((card) => card.id),
        })),
        activeTab,
        claimedMissions,
        dailyRewardClaimedAt,
        lastSeenAt: new Date().toISOString(),
    }), [activeTab, board, claimedMissions, dailyRewardClaimedAt, energy, hearts, mergeCount, openedPacks, playerLevel, xp]);

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

            void postSave(savePayload, true);
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
    }, [postSave, savePayload]);

    const queuePack = useCallback((pack: GamePackDefinition, labelOverride?: string) => {
        const cardsCount = Math.max(1, Math.min(pack.cardsCount, 10));
        const packCards = Array.from({ length: cardsCount }, () => chooseCard(cardPool)).filter(Boolean) as MelodyCard[];

        if (packCards.length === 0) {
            notify('No hay cartas activas para abrir sobres.');
            return;
        }

        setPendingPack({
            id: nanoid(),
            label: labelOverride ?? pack.label,
            cards: packCards,
        });
        setIsPackOpened(false);
        setDismissedPackCards(0);
        setPackCardResults([]);
        notify(assetsReady ? `${labelOverride ?? pack.label}: toca el sobre para abrirlo.` : 'Preparando cartas para el sobre.');
    }, [assetsReady, cardPool, notify]);

    const revealPendingPack = useCallback(() => {
        if (!pendingPack || isPackOpened) return;

        const ownedIds = new Set(collectedCards.map((card) => card.id));
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

            if (newCards.length > 0) {
                notify(`${newCards.length} carta nueva y duplicadas +${duplicateHearts} corazones.`);
            } else {
                notify(`Cartas duplicadas convertidas en +${duplicateHearts} corazones.`);
            }
        } else {
            notify(`${newCards.length} cartas nuevas agregadas al album.`);
        }

        setOpenedPacks((packs) => [pendingPack, ...packs]);
        setPackCardResults(nextResults);
        setIsPackOpened(true);
        setDismissedPackCards(0);
    }, [collectedCards, duplicateHeartRewards, isPackOpened, notify, pendingPack]);

    const claimDailyReward = useCallback(() => {
        const now = new Date().toISOString();

        setDailyRewardClaimedAt(now);
        setShowDailyReward(false);
        setEnergy((value) => Math.min(maxEnergy, value + dailyReward.energy));
        setHearts((value) => value + dailyReward.hearts);
        triggerFeedback();
        queuePack(getPack('daily'));
        notify(`Recompensa diaria: +${dailyReward.energy} energia y +${dailyReward.hearts} corazones.`);
    }, [dailyReward.energy, dailyReward.hearts, getPack, maxEnergy, notify, queuePack]);

    const advancePackCard = useCallback(() => {
        setDismissedPackCards((value) => Math.min(value + 1, 3));
    }, []);

    const addProgress = useCallback((itemLevel: number) => {
        const item = getMergeLevel(itemLevel);
        const gainedXp = item.xp;
        const gainedHearts = item.hearts;

        setHearts((value) => value + gainedHearts);
        setMergeCount((value) => value + 1);
        setXp((value) => {
            let nextXp = value + gainedXp;
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
                setEnergy((current) => Math.min(maxEnergy, current + gainedEnergy));
                const levelPack = getPack(rewardPackTrigger ?? 'level');
                queuePack(levelPack, levelsGained > 1 ? `${levelPack.label} x${levelsGained}` : levelPack.label);
                notify(levelsGained > 1 ? `Subiste ${levelsGained} niveles y ganaste energia.` : 'Subiste de nivel y ganaste energia.');
                return nextXp;
            }

            notify(`+${gainedXp} XP y +${gainedHearts} corazones.`);
            return nextXp;
        });
    }, [getMergeLevel, getPack, getPlayerLevel, maxEnergy, notify, playerLevel, queuePack]);

    const mergeCells = useCallback((from: number, to: number) => {
        if (from === to) return;

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
            triggerFeedback();
            addProgress(origin.level);

            if (newLevel >= rules.mergePackMinLevel && Math.random() * 100 < rules.mergePackChancePercent) {
                queuePack(getPack('merge'));
            }

            return next;
        });
    }, [addProgress, getPack, maxMergeItemLevel, notify, queuePack, rules.mergePackChancePercent, rules.mergePackMinLevel]);

    const generateItem = useCallback(() => {
        if (energy <= 0) {
            notify('La caja magica necesita energia.');
            return;
        }

        const firstEmpty = board.findIndex((cell) => !cell);

        if (firstEmpty === -1) {
            notify('El tablero esta lleno. Fusiona para abrir espacio.');
            return;
        }

        setEnergy((value) => value - 1);
        setBoard((current) => {
            const next = [...current];
            const generatedLevel = Math.random() * 100 < rules.magicBoxBonusChancePercent
                ? rules.magicBoxBonusLevel
                : rules.magicBoxPrimaryLevel;
            const level = Math.min(Math.max(1, generatedLevel), maxMergeItemLevel);
            next[firstEmpty] = makeItem(level);
            return next;
        });
        triggerFeedback();
        notify('La caja magica dejo una semilla.');
    }, [board, energy, maxMergeItemLevel, notify, rules.magicBoxBonusChancePercent, rules.magicBoxBonusLevel, rules.magicBoxPrimaryLevel]);

    const buyPack = useCallback(() => {
        const premiumPack = getPack('premium');

        if (hearts < premiumPack.costHearts) {
            notify(`Necesitas ${premiumPack.costHearts} corazones para comprar un sobre.`);
            return;
        }

        setHearts((value) => value - premiumPack.costHearts);
        triggerFeedback();
        queuePack(premiumPack);
    }, [getPack, hearts, notify, queuePack]);

    const claimMission = useCallback((missionId: string) => {
        const mission = missionDefinitions.find((item) => item.id === missionId);

        if (!mission || claimedMissions.includes(mission.id)) {
            return;
        }

        setClaimedMissions((missions) => [...missions, mission.id]);
        setHearts((value) => value + mission.reward.hearts);
        setEnergy((value) => Math.min(maxEnergy, value + mission.reward.energy));
        triggerFeedback();
        notify(`Mision completada: +${mission.reward.hearts} corazones${mission.reward.energy ? ` y +${mission.reward.energy} energia` : ''}.`);
    }, [claimedMissions, maxEnergy, missionDefinitions, notify]);

    const handleCellClick = useCallback((index: number) => {
        if (didPointerDragRef.current) {
            didPointerDragRef.current = false;
            return;
        }

        const cell = board[index];

        if (selectedCell === null) {
            if (cell) setSelectedCell(index);
            return;
        }

        mergeCells(selectedCell, index);
        setSelectedCell(null);
    }, [board, mergeCells, selectedCell]);

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

    return (
        <>
            <Head title="Melody Merge" />

            <main className="mm-app">
                <section className="mm-shell" aria-label="Melody Merge">
                    <header className="mm-header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark">
                                <Sparkles size={18} aria-hidden />
                            </div>
                            <div>
                                <p className="mm-kicker">Juego privado</p>
                                <h1>Melody Merge</h1>
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
                    </div>

                    <footer className="mm-footer">
                        <span>{freeCells} espacios libres</span>
                        <span>{mergeCount} fusiones</span>
                        <span>{collectedCards.length}/{cardPool.length} cartas</span>
                        <span>
                            {saveStatus === 'saving' ? 'guardando' :
                                saveStatus === 'saved' ? 'guardado' :
                                    saveStatus === 'error' ? 'sin guardar' :
                                        'auto'}
                        </span>
                    </footer>

                    {activeTab === 'merge' && (
                        <section className="mm-stage">
                            <div className="mm-board" aria-label="Tablero de fusion">
                                {board.map((cell, index) => {
                                    const item = cell ? getMergeLevel(cell.level) : null;

                                    return (
                                        <button
                                            className={`mm-cell ${item ? `mm-cell--filled mm-cell--${item.symbol}` : ''} ${selectedCell === index ? 'is-selected' : ''}`}
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
                                <button className="mm-magic-box" onClick={generateItem} type="button">
                                    <span className="mm-magic-box__lid" />
                                    <span className="mm-magic-box__body">
                                        <Wand2 size={22} aria-hidden />
                                    </span>
                                    <strong>Caja magica</strong>
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

                            <div className="mm-card-grid">
                                {cardPool.map((card) => {
                                    const owned = collectedCards.some((ownedCard) => ownedCard.id === card.id);

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
                                {collectedCards.length >= 3 && <span className="mm-room__plush" />}
                                {collectedCards.length >= 6 && <span className="mm-room__poster" />}
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

                    <nav className="mm-tabs" aria-label="Vistas">
                        <button className={activeTab === 'merge' ? 'is-active' : ''} onClick={() => setActiveTab('merge')} type="button">
                            <Wand2 size={19} aria-hidden />
                            <span>Merge</span>
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
                </section>
            </main>
        </>
    );
}
