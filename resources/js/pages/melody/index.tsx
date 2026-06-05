import '@/styles.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { Head } from '@inertiajs/react';
import {
    Album,
    Battery,
    Crown,
    Gift,
    Heart,
    PackageOpen,
    Sparkles,
    Trophy,
    Wand2,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import cardsManifest from '../../assets/cards/cards.json';

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

const boardSize = 25;
const maxEnergy = 100;
const premiumPackCost = 180;

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

export default function MelodyMergePage() {
    const [board, setBoard] = useState<Array<BoardItem | null>>(() => {
        const next = emptyBoard();
        next[7] = makeItem(1);
        next[12] = makeItem(1);
        next[17] = makeItem(2);
        return next;
    });
    const [energy, setEnergy] = useState(84);
    const [hearts, setHearts] = useState(120);
    const [xp, setXp] = useState(0);
    const [playerLevel, setPlayerLevel] = useState(1);
    const [mergeCount, setMergeCount] = useState(0);
    const [openedPacks, setOpenedPacks] = useState<PackReward[]>([]);
    const [pendingPack, setPendingPack] = useState<PackReward | null>(null);
    const [isPackOpened, setIsPackOpened] = useState(false);
    const [selectedCell, setSelectedCell] = useState<number | null>(null);
    const [draggedCell, setDraggedCell] = useState<number | null>(null);
    const [touchDrag, setTouchDrag] = useState<{
        index: number;
        x: number;
        y: number;
        item: BoardItem;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<'merge' | 'album' | 'room'>('merge');
    const [toastMessage, setToastMessage] = useState('Fusiona objetos iguales para ganar sobres.');
    const dragStartRef = useRef<{ index: number; x: number; y: number } | null>(null);
    const didPointerDragRef = useRef(false);

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

    const collectedCards = useMemo(() => {
        const unique = new Map<string, MelodyCard>();
        openedPacks.forEach((pack) => pack.cards.forEach((card) => unique.set(card.id, card)));
        return [...unique.values()];
    }, [openedPacks]);

    const xpGoal = xpForLevel(playerLevel);
    const albumPercent = Math.round((collectedCards.length / cardPool.length) * 100);
    const freeCells = board.filter((cell) => !cell).length;

    const queuePack = useCallback((label: string) => {
        setPendingPack({
            id: nanoid(),
            label,
            cards: [chooseCard(), chooseCard(), chooseCard()],
        });
        setIsPackOpened(false);
        notify(`${label}: toca el sobre para abrirlo.`);
    }, [notify]);

    const revealPendingPack = useCallback(() => {
        if (!pendingPack || isPackOpened) return;

        setOpenedPacks((packs) => [pendingPack, ...packs]);
        setIsPackOpened(true);
        notify('Nuevas cartas agregadas al album.');
    }, [isPackOpened, notify, pendingPack]);

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
        { label: 'Colecciona 12 cartas', value: Math.min(collectedCards.length, 12), goal: 12 },
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
                                                <article className={`mm-card ${owned ? 'is-owned' : ''} rarity-${card.rarity.toLowerCase()}`} key={card.id}>
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
                                                </article>
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

                    {pendingPack && (
                        <div className="mm-pack-modal" role="dialog" aria-modal="true" aria-label={pendingPack.label}>
                            <div className="mm-pack-modal__panel">
                                <button className={`mm-envelope ${isPackOpened ? 'is-open' : ''}`} onClick={revealPendingPack} type="button">
                                    <span className="mm-envelope__flap" />
                                    <span className="mm-envelope__seal">
                                        <PackageOpen size={24} aria-hidden />
                                    </span>
                                    <strong>{isPackOpened ? 'Abierto' : pendingPack.label}</strong>
                                </button>

                                {isPackOpened ? (
                                    <>
                                        <div className="mm-pack-modal__cards">
                                            {pendingPack.cards.map((card, index) => (
                                                <div className={`mm-reward-card rarity-${card.rarity.toLowerCase()}`} key={`${pendingPack.id}-${card.id}-${index}`}>
                                                    <img alt={card.name} src={card.imageUrl} />
                                                    <span>{card.rarity}</span>
                                                    <strong>{card.name}</strong>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="mm-pack-modal__close" onClick={() => setPendingPack(null)} type="button">
                                            Guardar
                                        </button>
                                    </>
                                ) : (
                                    <p>Presiona el sello para cortar el sobre.</p>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
