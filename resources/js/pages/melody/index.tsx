import '@/styles.css';

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
    Sparkles,
    Trophy,
    Wand2,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import cardsManifest from '../../assets/cards/cards.json';
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
    imageUrl: string;
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
    dailyRewardClaimedAt?: string | null;
    lastSeenAt?: string | null;
};

type MelodyMergePageProps = {
    gameSave?: MelodyGameSave | null;
    auth?: {
        user?: {
            name?: string;
        } | null;
    };
};

const boardSize = 25;
const maxEnergy = 100;
const premiumPackCost = 180;
const dailyReward = {
    energy: 30,
    hearts: 120,
};

const duplicateHeartRewards: Record<CardRarity, number> = {
    C: 8,
    R: 18,
    SR: 34,
    SSR: 62,
    UR: 110,
    SECRET: 180,
};

const mergeChain = [
    { level: 1, name: 'Semilla', symbol: 'seed', xp: 6, hearts: 1 },
    { level: 2, name: 'Flor', symbol: 'flower', xp: 10, hearts: 2 },
    { level: 3, name: 'Ramo', symbol: 'bouquet', xp: 16, hearts: 4 },
    { level: 4, name: 'Peluche', symbol: 'plush', xp: 26, hearts: 7 },
    { level: 5, name: 'Lazo', symbol: 'bow', xp: 42, hearts: 11 },
    { level: 6, name: 'Corona', symbol: 'crown', xp: 68, hearts: 18 },
    { level: 7, name: 'Tesoro', symbol: 'gem', xp: 108, hearts: 28 },
    { level: 8, name: 'Castillo', symbol: 'castle', xp: 166, hearts: 42 },
    { level: 9, name: 'Palacio', symbol: 'palace', xp: 248, hearts: 62 },
    { level: 10, name: 'Legendario', symbol: 'rainbow', xp: 360, hearts: 90 },
];

type CardManifestItem = {
    id: number;
    personaje: string;
    categoria: string;
    rareza: CardRarity;
    archivo: string;
};

const cardImages = import.meta.glob('../../assets/cards/**/*.png', {
    eager: true,
    import: 'default',
    query: '?url',
}) as Record<string, string>;

const getCardImage = (file: string) => cardImages[`../../assets/cards/${file}`] ?? '';

const cardPool: MelodyCard[] = (cardsManifest as CardManifestItem[]).map((card) => ({
    id: `card-${card.id}`,
    name: card.personaje,
    collection: card.categoria,
    rarity: card.rareza,
    flavor: `${card.rareza} - ${card.categoria}`,
    imageUrl: getCardImage(card.archivo),
}));

const cardsById = new Map(cardPool.map((card) => [card.id, card]));

const emptyBoard = (): Array<BoardItem | null> => Array.from({ length: boardSize }, () => null);

const getLevel = (level: number) => mergeChain[Math.min(level, mergeChain.length) - 1];

const xpForLevel = (level: number) => Math.round(60 + (level - 1) * 110 + Math.pow(level - 1, 2) * 35);

const chooseCard = (): MelodyCard => {
    const roll = Math.random();

    const rarity: CardRarity =
        roll > 0.965 ? 'UR' :
            roll > 0.78 ? 'SSR' :
                roll > 0.46 ? 'SR' :
                    'R';

    const options = cardPool.filter((card) => card.rarity === rarity);
    return options[Math.floor(Math.random() * options.length)] ?? cardPool[0];
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

const normalizePacks = (packs?: SavedPackReward[]) => {
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

const getOfflineEnergyGain = (lastSeenAt: string | null | undefined, savedEnergy: number) => {
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

export default function MelodyMergePage({ gameSave, auth }: MelodyMergePageProps) {
    const savedEnergy = Math.min(Math.max(gameSave?.energy ?? 84, 0), maxEnergy);
    const offlineEnergyGain = getOfflineEnergyGain(gameSave?.lastSeenAt, savedEnergy);
    const [board, setBoard] = useState<Array<BoardItem | null>>(() => normalizeBoard(gameSave?.board));
    const [energy, setEnergy] = useState(Math.min(savedEnergy + offlineEnergyGain, maxEnergy));
    const [hearts, setHearts] = useState(Math.max(gameSave?.hearts ?? 120, 0));
    const [xp, setXp] = useState(Math.max(gameSave?.xp ?? 0, 0));
    const [playerLevel, setPlayerLevel] = useState(Math.max(gameSave?.playerLevel ?? 1, 1));
    const [mergeCount, setMergeCount] = useState(Math.max(gameSave?.mergeCount ?? 0, 0));
    const [openedPacks, setOpenedPacks] = useState<PackReward[]>(() => normalizePacks(gameSave?.openedPacks));
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
    const dragStartRef = useRef<{ index: number; x: number; y: number } | null>(null);
    const didPointerDragRef = useRef(false);
    const didMountSaveRef = useRef(offlineEnergyGain > 0);
    const saveTimerRef = useRef<number | null>(null);

    const notify = useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setEnergy((value) => Math.min(maxEnergy, value + 1));
        }, 60000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!toastMessage) return;

        const timer = window.setTimeout(() => setToastMessage(''), 2600);
        return () => window.clearTimeout(timer);
    }, [toastMessage]);

    useEffect(() => {
        let cancelled = false;
        const urls = [packImageUrl, ...cardPool.map((card) => card.imageUrl)];

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
    }, []);

    const collectedCards = useMemo(() => {
        const unique = new Map<string, MelodyCard>();
        openedPacks.forEach((pack) => pack.cards.forEach((card) => unique.set(card.id, card)));
        return [...unique.values()];
    }, [openedPacks]);

    const xpGoal = xpForLevel(playerLevel);
    const albumPercent = Math.round((collectedCards.length / cardPool.length) * 100);
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
        dailyRewardClaimedAt,
        lastSeenAt: new Date().toISOString(),
    }), [activeTab, board, dailyRewardClaimedAt, energy, hearts, mergeCount, openedPacks, playerLevel, xp]);

    useEffect(() => {
        if (!didMountSaveRef.current) {
            didMountSaveRef.current = true;
            return;
        }

        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = window.setTimeout(() => {
            fetch('/melody/save', {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ payload: savePayload }),
            }).catch(() => {
                notify('No se pudo guardar la partida. Revisa tu conexion.');
            });
        }, 850);

        return () => {
            if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current);
            }
        };
    }, [notify, savePayload]);

    const queuePack = useCallback((label: string) => {
        setPendingPack({
            id: nanoid(),
            label,
            cards: [chooseCard(), chooseCard(), chooseCard()],
        });
        setIsPackOpened(false);
        setDismissedPackCards(0);
        setPackCardResults([]);
        notify(assetsReady ? `${label}: toca el sobre para abrirlo.` : 'Preparando cartas para el sobre.');
    }, [assetsReady, notify]);

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
    }, [collectedCards, isPackOpened, notify, pendingPack]);

    const claimDailyReward = useCallback(() => {
        const now = new Date().toISOString();

        setDailyRewardClaimedAt(now);
        setShowDailyReward(false);
        setEnergy((value) => Math.min(maxEnergy, value + dailyReward.energy));
        setHearts((value) => value + dailyReward.hearts);
        queuePack('Sobre diario');
        notify(`Recompensa diaria: +${dailyReward.energy} energia y +${dailyReward.hearts} corazones.`);
    }, [notify, queuePack]);

    const advancePackCard = useCallback(() => {
        setDismissedPackCards((value) => Math.min(value + 1, 3));
    }, []);

    const addProgress = useCallback((itemLevel: number) => {
        const item = getLevel(itemLevel);
        const gainedXp = item.xp;
        const gainedHearts = item.hearts;

        setHearts((value) => value + gainedHearts);
        setMergeCount((value) => value + 1);
        setXp((value) => {
            const nextXp = value + gainedXp;
            const goal = xpForLevel(playerLevel);

            if (nextXp >= goal) {
                setPlayerLevel((level) => level + 1);
                setEnergy((current) => Math.min(maxEnergy, current + 20));
                queuePack('Sobre de nivel');
                notify('Subiste de nivel y ganaste energia.');
                return nextXp - goal;
            }

            notify(`+${gainedXp} XP y +${gainedHearts} corazones.`);
            return nextXp;
        });
    }, [notify, playerLevel, queuePack]);

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

            const newLevel = Math.min(origin.level + 1, mergeChain.length);
            next[to] = makeItem(newLevel);
            next[from] = null;
            addProgress(origin.level);

            if (newLevel >= 5 && Math.random() > 0.92) {
                queuePack('Sobre por fusion');
            }

            return next;
        });
    }, [addProgress, notify, queuePack]);

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
            const level = Math.random() > 0.82 ? 2 : 1;
            next[firstEmpty] = makeItem(level);
            return next;
        });
        notify('La caja magica dejo una semilla.');
    }, [board, energy, notify]);

    const buyPack = useCallback(() => {
        if (hearts < premiumPackCost) {
            notify(`Necesitas ${premiumPackCost} corazones para comprar un sobre.`);
            return;
        }

        setHearts((value) => value - premiumPackCost);
        queuePack('Sobre premium');
    }, [hearts, notify, queuePack]);

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

    const missions = [
        { label: 'Fusiona 60 objetos', value: Math.min(mergeCount, 60), goal: 60 },
        { label: 'Colecciona 14 cartas', value: Math.min(collectedCards.length, 14), goal: 14 },
        { label: 'Guarda 500 corazones', value: Math.min(hearts, 500), goal: 500 },
    ];

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
                    </footer>

                    {activeTab === 'merge' && (
                        <section className="mm-stage">
                            <div className="mm-board" aria-label="Tablero de fusion">
                                {board.map((cell, index) => (
                                    <button
                                        className={`mm-cell ${cell ? `mm-cell--filled mm-cell--${getLevel(cell.level).symbol}` : ''} ${selectedCell === index ? 'is-selected' : ''}`}
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
                                        {cell && (
                                            <span className={`mm-piece mm-piece--${getLevel(cell.level).symbol}`}>
                                                <span className="mm-piece__shine" />
                                                <span className="mm-piece__name">{getLevel(cell.level).name}</span>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {touchDrag && (
                                <div
                                    className="mm-drag-preview"
                                    style={{
                                        left: touchDrag.x,
                                        top: touchDrag.y,
                                    }}
                                >
                                    <span className={`mm-piece mm-piece--${getLevel(touchDrag.item.level).symbol}`}>
                                        <span className="mm-piece__shine" />
                                        <span className="mm-piece__name">{getLevel(touchDrag.item.level).name}</span>
                                    </span>
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
                                    <span>{premiumPackCost}</span>
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
