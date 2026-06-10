import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Album,
    Battery,
    Brain,
    Crown,
    Gift,
    Heart,
    LogOut,
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
import packImageUrl from '../../assets/sanrio_pack.png?url';
import logoUrl from '../../assets/logo.png?url';
import { sfx } from '@/lib/sounds';
import { music } from '@/lib/music';
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
} from '@/lib/game-constants';
import type {
    BoardItem,
    CardRarity,
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

const makeItem = (level = 1): BoardItem => ({
    id: nanoid(),
    level,
});

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
    const [activeTab, setActiveTab] = useState<MelodyTab>(() => normalizeTab(gameSave?.activeTab));
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
        if (memoryTimerRef.current) {
            window.clearTimeout(memoryTimerRef.current);
            memoryTimerRef.current = null;
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
    }, []);

    useEffect(() => {
        if (!toastMessage) return;

        const timer = window.setTimeout(() => setToastMessage(''), 2600);
        return () => window.clearTimeout(timer);
    }, [toastMessage]);

    useEffect(() => {
        const timer = window.setTimeout(() => setShowSplash(false), 1800);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        void music.init();
        const unsub = music.subscribe((state) => setMusicPlaying(state.playing));
        return unsub;
    }, []);

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
    const collectedIds = useMemo(() => new Set(collectedCards.map((card) => card.id)), [collectedCards]);
    const filteredAlbumCards = useMemo(
        () => albumFilter === 'all' ? cardPool : cardPool.filter((card) => card.rarity === albumFilter),
        [albumFilter, cardPool],
    );
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
        const cardsCount = Math.max(1, Math.min(pack.cardsCount, 3));
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
        sfx.cardReveal();
    }, [collectedCards, duplicateHeartRewards, isPackOpened, notify, pendingPack]);

    const claimDailyReward = useCallback(() => {
        const now = new Date().toISOString();

        setDailyRewardClaimedAt(now);
        setShowDailyReward(false);
        setEnergy((value) => Math.min(maxEnergy, value + dailyReward.energy));
        setHearts((value) => value + dailyReward.hearts);
        triggerFeedback();
        sfx.claim();
        queuePack(getPack('daily'));
        notify(`Recompensa diaria: +${dailyReward.energy} energia y +${dailyReward.hearts} corazones.`);
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
                        notify(`Memoria completo: +${rewardHearts} corazones y +${rewardEnergy} energia.`);
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
    }, [flippedMemoryCards, maxEnergy, memoryDeck, memoryLocked, memorySource.length, notify]);

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
                {showSplash && (
                    <div className="mm-splash">
                        <div className="mm-splash__icon">
                            <img alt="My Home" className="mm-splash__logo" src={logoUrl} />
                        </div>
                        <h1>My Home</h1>
                        <p>{getDailyMessage()}</p>
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
