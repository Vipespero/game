import '@/styles.css';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Album,
    Battery,
    Crown,
    Gift,
    Heart,
    PackageOpen,
    Sparkles,
    Star,
    Trophy,
    Wand2,
} from 'lucide-react';
import { nanoid } from 'nanoid';

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
    symbol: string;
};

type PackReward = {
    id: string;
    label: string;
    cards: MelodyCard[];
};

const boardSize = 25;
const maxEnergy = 100;

const mergeChain = [
    { level: 1, name: 'Semilla', symbol: 'seed', xp: 1, hearts: 2 },
    { level: 2, name: 'Flor', symbol: 'flower', xp: 2, hearts: 4 },
    { level: 3, name: 'Ramo', symbol: 'bouquet', xp: 5, hearts: 9 },
    { level: 4, name: 'Peluche', symbol: 'plush', xp: 10, hearts: 16 },
    { level: 5, name: 'Lazo', symbol: 'bow', xp: 18, hearts: 28 },
    { level: 6, name: 'Corona', symbol: 'crown', xp: 32, hearts: 44 },
    { level: 7, name: 'Tesoro', symbol: 'gem', xp: 55, hearts: 70 },
    { level: 8, name: 'Castillo', symbol: 'castle', xp: 90, hearts: 110 },
    { level: 9, name: 'Palacio', symbol: 'palace', xp: 140, hearts: 170 },
    { level: 10, name: 'Legendario', symbol: 'rainbow', xp: 220, hearts: 260 },
];

const cardPool: MelodyCard[] = [
    { id: 'c-01', name: 'Dulce Jardin', collection: 'Melody Garden', rarity: 'C', flavor: 'Flores suaves para empezar el album.', symbol: 'flower' },
    { id: 'c-02', name: 'Nube de Algodon', collection: 'Dream Room', rarity: 'C', flavor: 'Una decoracion ligera y brillante.', symbol: 'cloud' },
    { id: 'c-03', name: 'Lazo Rosa', collection: 'Melody Garden', rarity: 'R', flavor: 'El primer accesorio especial.', symbol: 'bow' },
    { id: 'c-04', name: 'Taza de Estrellas', collection: 'Moon Tea', rarity: 'R', flavor: 'Perfecta para una noche tranquila.', symbol: 'starcup' },
    { id: 'c-05', name: 'Corona Pastel', collection: 'Royal Cute', rarity: 'SR', flavor: 'Brilla cuando completas misiones.', symbol: 'crown' },
    { id: 'c-06', name: 'Vestidor Encantado', collection: 'Dream Room', rarity: 'SR', flavor: 'Abre nuevas ideas de decoracion.', symbol: 'mirror' },
    { id: 'c-07', name: 'Palacio de Cristal', collection: 'Royal Cute', rarity: 'SSR', flavor: 'Una carta rara para el album real.', symbol: 'castle' },
    { id: 'c-08', name: 'Noche Violeta', collection: 'Moon Tea', rarity: 'SSR', flavor: 'Magia tranquila con destellos lunares.', symbol: 'moon' },
    { id: 'c-09', name: 'Arco Iris Secreto', collection: 'Especial', rarity: 'UR', flavor: 'Solo aparece en sobres con mucha suerte.', symbol: 'rainbow' },
    { id: 'c-10', name: 'Vale por un Helado', collection: 'Secretas', rarity: 'SECRET', flavor: 'Recompensa personal pendiente de canjear.', symbol: 'ticket' },
    { id: 'c-11', name: 'Escoge la Pelicula', collection: 'Secretas', rarity: 'SECRET', flavor: 'Una sorpresa real desbloqueada jugando.', symbol: 'film' },
    { id: 'c-12', name: 'Carta Sorpresa', collection: 'Secretas', rarity: 'SECRET', flavor: 'No se explica. Se descubre.', symbol: 'gift' },
];

const emptyBoard = (): Array<BoardItem | null> => Array.from({ length: boardSize }, () => null);

const getLevel = (level: number) => mergeChain[Math.min(level, mergeChain.length) - 1];

const xpForLevel = (level: number) => Math.round(100 + (level - 1) * 150 + Math.pow(level - 1, 2) * 60);

const chooseCard = (): MelodyCard => {
    const roll = Math.random();

    const rarity: CardRarity =
        roll > 0.985 ? 'SECRET' :
            roll > 0.955 ? 'UR' :
                roll > 0.88 ? 'SSR' :
                    roll > 0.72 ? 'SR' :
                        roll > 0.42 ? 'R' :
                            'C';

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
    const [selectedCell, setSelectedCell] = useState<number | null>(null);
    const [draggedCell, setDraggedCell] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'merge' | 'album' | 'room'>('merge');
    const [message, setMessage] = useState('Fusiona objetos iguales para ganar sobres.');

    useEffect(() => {
        const timer = window.setInterval(() => {
            setEnergy((value) => Math.min(maxEnergy, value + 1));
        }, 60000);

        return () => window.clearInterval(timer);
    }, []);

    const collectedCards = useMemo(() => {
        const unique = new Map<string, MelodyCard>();
        openedPacks.forEach((pack) => pack.cards.forEach((card) => unique.set(card.id, card)));
        return [...unique.values()];
    }, [openedPacks]);

    const xpGoal = xpForLevel(playerLevel);
    const albumPercent = Math.round((collectedCards.length / cardPool.length) * 100);
    const freeCells = board.filter((cell) => !cell).length;

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
                setOpenedPacks((packs) => [
                    {
                        id: nanoid(),
                        label: 'Sobre de nivel',
                        cards: [chooseCard(), chooseCard(), chooseCard()],
                    },
                    ...packs,
                ]);
                setMessage('Subiste de nivel y ganaste un sobre.');
                return nextXp - goal;
            }

            setMessage(`+${gainedXp} XP y +${gainedHearts} corazones.`);
            return nextXp;
        });
    }, [playerLevel]);

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
                setMessage('Objeto movido.');
                return next;
            }

            if (origin.level !== target.level) {
                setMessage('Solo se fusionan objetos iguales.');
                return current;
            }

            const newLevel = Math.min(origin.level + 1, mergeChain.length);
            next[to] = makeItem(newLevel);
            next[from] = null;
            addProgress(origin.level);

            if (newLevel >= 4 && Math.random() > 0.62) {
                setOpenedPacks((packs) => [
                    {
                        id: nanoid(),
                        label: 'Sobre por fusion',
                        cards: [chooseCard(), chooseCard(), chooseCard()],
                    },
                    ...packs,
                ]);
                setMessage('Fusion perfecta: ganaste un sobre.');
            }

            return next;
        });
    }, [addProgress]);

    const generateItem = useCallback(() => {
        if (energy <= 0) {
            setMessage('La caja magica necesita energia.');
            return;
        }

        const firstEmpty = board.findIndex((cell) => !cell);

        if (firstEmpty === -1) {
            setMessage('El tablero esta lleno. Fusiona para abrir espacio.');
            return;
        }

        setEnergy((value) => value - 1);
        setBoard((current) => {
            const next = [...current];
            const level = Math.random() > 0.82 ? 2 : 1;
            next[firstEmpty] = makeItem(level);
            return next;
        });
        setMessage('La caja magica dejo un regalo en el tablero.');
    }, [board, energy]);

    const buyPack = useCallback(() => {
        if (hearts < 80) {
            setMessage('Necesitas 80 corazones para comprar un sobre.');
            return;
        }

        setHearts((value) => value - 80);
        setOpenedPacks((packs) => [
            {
                id: nanoid(),
                label: 'Sobre premium',
                cards: [chooseCard(), chooseCard(), chooseCard()],
            },
            ...packs,
        ]);
        setMessage('Abriste un sobre premium.');
    }, [hearts]);

    const handleCellClick = useCallback((index: number) => {
        const cell = board[index];

        if (selectedCell === null) {
            if (cell) setSelectedCell(index);
            return;
        }

        mergeCells(selectedCell, index);
        setSelectedCell(null);
    }, [board, mergeCells, selectedCell]);

    const missions = [
        { label: 'Fusiona 20 objetos', value: Math.min(mergeCount, 20), goal: 20 },
        { label: 'Colecciona 6 cartas', value: Math.min(collectedCards.length, 6), goal: 6 },
        { label: 'Guarda 300 corazones', value: Math.min(hearts, 300), goal: 300 },
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

                    <nav className="mm-tabs" aria-label="Vistas">
                        <button className={activeTab === 'merge' ? 'is-active' : ''} onClick={() => setActiveTab('merge')} type="button">
                            <Wand2 size={17} aria-hidden />
                            <span>Merge</span>
                        </button>
                        <button className={activeTab === 'album' ? 'is-active' : ''} onClick={() => setActiveTab('album')} type="button">
                            <Album size={17} aria-hidden />
                            <span>Album</span>
                        </button>
                        <button className={activeTab === 'room' ? 'is-active' : ''} onClick={() => setActiveTab('room')} type="button">
                            <Gift size={17} aria-hidden />
                            <span>Sala</span>
                        </button>
                    </nav>

                    {activeTab === 'merge' && (
                        <section className="mm-stage">
                            <div className="mm-board" aria-label="Tablero de fusion">
                                {board.map((cell, index) => (
                                    <button
                                        className={`mm-cell ${cell ? 'mm-cell--filled' : ''} ${selectedCell === index ? 'is-selected' : ''}`}
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

                            <div className="mm-actions">
                                <button className="mm-magic-box" onClick={generateItem} type="button">
                                    <span className="mm-magic-box__lid" />
                                    <span className="mm-magic-box__body">
                                        <Wand2 size={22} aria-hidden />
                                    </span>
                                    <strong>Caja magica</strong>
                                </button>

                                <div className="mm-message">
                                    <Sparkles size={16} aria-hidden />
                                    <span>{message}</span>
                                </div>
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
                                    <span>80</span>
                                </button>
                            </div>

                            <div className="mm-card-grid">
                                {cardPool.map((card) => {
                                    const owned = collectedCards.some((ownedCard) => ownedCard.id === card.id);

                                    return (
                                        <article className={`mm-card ${owned ? 'is-owned' : ''} rarity-${card.rarity.toLowerCase()}`} key={card.id}>
                                            <div className={`mm-card__symbol mm-card__symbol--${card.symbol}`}>
                                                {owned ? <Star size={22} aria-hidden /> : '?'}
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

                    {openedPacks[0] && (
                        <aside className="mm-pack" aria-label="Ultimo sobre abierto">
                            <div className="mm-section-title">
                                <PackageOpen size={17} aria-hidden />
                                <h2>{openedPacks[0].label}</h2>
                            </div>
                            <div className="mm-pack__cards">
                                {openedPacks[0].cards.map((card, index) => (
                                    <div className={`mm-mini-card rarity-${card.rarity.toLowerCase()}`} key={`${openedPacks[0].id}-${card.id}-${index}`}>
                                        <span>{card.rarity}</span>
                                        <strong>{card.name}</strong>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    )}

                    <footer className="mm-footer">
                        <span>{freeCells} espacios libres</span>
                        <span>{mergeCount} fusiones</span>
                        <span>{collectedCards.length}/{cardPool.length} cartas</span>
                    </footer>
                </section>
            </main>
        </>
    );
}
