import type { CSSProperties } from 'react';

import type {
    CardRarity,
    GameConfig,
    GamePackDefinition,
    GameRules,
    MelodyCard,
    MergeItemDefinition,
    MergeItemSource,
    MissionDefinition,
    PlayerLevelDefinition,
} from '@/types/game';

export const boardSize = 25;

export const fallbackGameConfig: GameConfig = {
    maxEnergy: 100,
    dailyRewardEnergy: 30,
    dailyRewardHearts: 120,
};

export const fallbackGameRules: GameRules = {
    magicBoxPrimaryLevel: 1,
    magicBoxBonusLevel: 2,
    magicBoxBonusChancePercent: 18,
    mergePackMinLevel: 5,
    mergePackChancePercent: 8,
};

export const fallbackMissions: MissionDefinition[] = [
    { id: 'merge-20', label: 'Fusiona 20 objetos', progressKey: 'merge_count', goal: 20, reward: { hearts: 80, energy: 10 } },
    { id: 'album-5', label: 'Colecciona 5 cartas', progressKey: 'collected_cards', goal: 5, reward: { hearts: 120, energy: 15 } },
    { id: 'hearts-500', label: 'Guarda 500 corazones', progressKey: 'hearts', goal: 500, reward: { hearts: 160, energy: 0 } },
];

export const fallbackGamePacks: GamePackDefinition[] = [
    { id: 'premium', label: 'Sobre premium', triggerKey: 'premium', costHearts: 180, cardsCount: 3 },
    { id: 'daily', label: 'Sobre diario', triggerKey: 'daily', costHearts: 0, cardsCount: 3 },
    { id: 'level', label: 'Sobre de nivel', triggerKey: 'level', costHearts: 0, cardsCount: 3 },
    { id: 'merge', label: 'Sobre por fusion', triggerKey: 'merge', costHearts: 0, cardsCount: 3 },
];

export const fallbackDuplicateHeartRewards: Record<CardRarity, number> = {
    C: 8,
    R: 18,
    SR: 34,
    SSR: 62,
    UR: 110,
    SECRET: 180,
};

export const mergeChain: MergeItemSource[] = [
    { level: 1, name: 'Corona', symbol: 'crown', imagePath: 'pochaco.png', backgroundStyle: 'linear-gradient(145deg, #fff4c7, #ffbd59 52%, #ff8a3d)', borderRadius: '50%', imageSize: 106, imageOffsetX: 0, imageOffsetY: 4, xp: 6, hearts: 1, isActive: true },
    { level: 2, name: 'Flor', symbol: 'flower', imagePath: 'pompompurin.png', backgroundStyle: 'linear-gradient(145deg, #ffe79d, #ffba54)', borderRadius: '50%', imageSize: 88, imageOffsetX: 0, imageOffsetY: 0, xp: 10, hearts: 2, isActive: true },
    { level: 3, name: 'Castillo', symbol: 'castle', imagePath: 'Fresa.png', backgroundStyle: 'linear-gradient(145deg, #c9ff9c, #ff8ab3 50%, #e32266)', borderRadius: '50%', imageSize: 110, imageOffsetX: 0, imageOffsetY: 3, xp: 16, hearts: 4, isActive: true },
    { level: 4, name: 'Peluche', symbol: 'plush', imagePath: 'cinamoom.png', backgroundStyle: 'linear-gradient(145deg, #d8f4ff, #76cbff)', borderRadius: '50%', imageSize: 92, imageOffsetX: 0, imageOffsetY: 4, xp: 26, hearts: 7, isActive: true },
    { level: 5, name: 'Lazo', symbol: 'bow', imagePath: 'bibble.png', backgroundStyle: 'linear-gradient(145deg, #f7c4ff, #b56cff 52%, #7c4dff)', borderRadius: '50%', imageSize: 104, imageOffsetX: 0, imageOffsetY: 2, xp: 42, hearts: 11, isActive: true },
    { level: 6, name: 'Semilla', symbol: 'seed', imagePath: 'Melody1.png', backgroundStyle: 'linear-gradient(145deg, #ff9696, #e73b3b)', borderRadius: '50%', imageSize: 86, imageOffsetX: 0, imageOffsetY: 8, xp: 68, hearts: 18, isActive: true },
    { level: 7, name: 'Tesoro', symbol: 'gem', imagePath: 'maria.png', backgroundStyle: 'linear-gradient(145deg, #ffc1dc, #9d4edd 55%, #35235f)', borderRadius: '50%', imageSize: 118, imageOffsetX: 0, imageOffsetY: 5, xp: 108, hearts: 28, isActive: true },
    { level: 8, name: 'Ramo', symbol: 'bouquet', imagePath: 'Mymelodyrosa.png', backgroundStyle: 'linear-gradient(145deg, #ffd8ee, #ff74b8)', borderRadius: '50%', imageSize: 76, imageOffsetX: 0, imageOffsetY: 6, xp: 166, hearts: 42, isActive: true },
    { level: 9, name: 'Palacio', symbol: 'palace', imagePath: 'Gengar.png', backgroundStyle: 'linear-gradient(145deg, #d9b4ff, #8b5cf6 52%, #4c1d95)', borderRadius: '50%', imageSize: 116, imageOffsetX: 0, imageOffsetY: 2, xp: 248, hearts: 62, isActive: true },
    { level: 10, name: 'Legendario', symbol: 'rainbow', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #ffe66d, #ff78bd 52%, #8b5cf6)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 360, hearts: 90, isActive: true },
    { level: 11, name: 'Estrella', symbol: 'star', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #fff1a8, #ff7ab6 55%, #9d77ff)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 510, hearts: 128, isActive: true },
    { level: 12, name: 'Cometa', symbol: 'comet', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #b8f4ff, #7c83ff 52%, #ff92d0)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 706, hearts: 178, isActive: true },
    { level: 13, name: 'Nube', symbol: 'cloud', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #fef3ff, #a5d8ff 52%, #f0abfc)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 958, hearts: 240, isActive: true },
    { level: 14, name: 'Campana', symbol: 'bell', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #fff0a6, #ffbd59 52%, #ff7ab6)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 1278, hearts: 320, isActive: true },
    { level: 15, name: 'Cupcake', symbol: 'cupcake', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #ffd6e8, #ff8cc6 52%, #b794f4)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 1680, hearts: 420, isActive: true },
    { level: 16, name: 'Diamante', symbol: 'diamond', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #9ff3ff, #77a7ff 52%, #d68cff)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 2182, hearts: 546, isActive: true },
    { level: 17, name: 'Jardin', symbol: 'garden', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #c7ffd8, #72d6a4 52%, #ff99cf)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 2804, hearts: 702, isActive: true },
    { level: 18, name: 'Sueño', symbol: 'dream', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #d7c6ff, #8b5cf6 52%, #ff8cc6)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 3570, hearts: 892, isActive: true },
    { level: 19, name: 'Reino', symbol: 'kingdom', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #ffe7a8, #ff87c2 48%, #7dd3fc)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 4508, hearts: 1128, isActive: true },
    { level: 20, name: 'Final', symbol: 'final', imagePath: null, backgroundStyle: 'linear-gradient(145deg, #fff1a8, #ff78bd 42%, #8b5cf6 72%, #65d7ff)', borderRadius: '50%', imageSize: 100, imageOffsetX: 0, imageOffsetY: 0, xp: 5650, hearts: 1412, isActive: true },
];

const assetImages = import.meta.glob('../assets/**/*.png', {
    eager: true,
    import: 'default',
    query: '?url',
}) as Record<string, string>;

export const getAssetImage = (file?: string | null) => {
    if (!file) {
        return '';
    }

    if (file.startsWith('http') || file.startsWith('/')) {
        return file;
    }

    return assetImages[`../assets/${file}`] ?? '';
};

export const getCardImage = (file: string) => {
    if (file.startsWith('http') || file.startsWith('/')) {
        return file;
    }

    return getAssetImage(`cards/${file}`);
};

export const getLevel = (level: number, items: MergeItemDefinition[]) =>
    items.find((item) => item.level === level) ?? (items[Math.min(Math.max(level, 1), items.length) - 1] as MergeItemDefinition);

export const pieceStyle = (item: MergeItemDefinition): CSSProperties => ({
    background: item.backgroundStyle || undefined,
    borderRadius: item.borderRadius || undefined,
    '--mm-piece-image-size': `${item.imageSize || 86}%`,
    '--mm-piece-image-x': `${item.imageOffsetX || 0}%`,
    '--mm-piece-image-y': `${item.imageOffsetY || 0}%`,
} as CSSProperties);

export const xpForLevel = (level: number) => Math.round(60 + (level - 1) * 110 + Math.pow(level - 1, 2) * 35);

export const fallbackPlayerLevels: PlayerLevelDefinition[] = Array.from({ length: 100 }, (_, index) => ({
    level: index + 1,
    xpRequired: xpForLevel(index + 1),
    rewardEnergy: 20,
    rewardPackTrigger: 'level',
    isActive: true,
}));

export const fallbackMergeItems: MergeItemDefinition[] = mergeChain.map((item) => ({
    ...item,
    imageUrl: getAssetImage(item.imagePath),
}));

export const chooseCard = (cardPool: MelodyCard[]): MelodyCard | null => {
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

export const dailyMessages = [
    'Eres mi persona favorita en todo el mundo.',
    'Cada dia agradezco por tenerte en mi vida.',
    'Tu sonrisa es mi cosa favorita.',
    'Me haces querer ser mejor persona.',
    'No hay nadie como tu, y eso me encanta.',
    'Contigo todo es mas bonito.',
    'Eres mi calma en medio del caos.',
    'Me gusta todo de ti, sin excepciones.',
    'Gracias por estar siempre ahi.',
    'Tu felicidad es mi prioridad.',
    'Eres mas fuerte de lo que crees.',
    'Me inspire en ti para crear este juego.',
    'Cada momento contigo vale oro.',
    'Eres mi lugar seguro.',
    'No necesito nada mas que tu.',
    'Tu risa es mi sonido favorito.',
    'Siempre voy a elegirte a ti.',
    'Eres el mejor capitulo de mi historia.',
    'Me haces sentir en casa.',
    'Orgulloso de la mujer que eres.',
    'Tu eres mi suerte.',
    'Nunca me canso de ti.',
    'Eres mi sol en dias nublados.',
    'Mi corazon es tuyo, siempre.',
    'La vida es mejor contigo.',
    'Eres mi pensamiento favorito.',
    'Tu existencia me hace feliz.',
    'Gracias por ser tu.',
    'Eres mi todo.',
    'Te elijo hoy y siempre.',
    'Tu amor me hace invencible.',
];

export const getDailyMessage = (): string => {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
    );

    return dailyMessages[dayOfYear % dailyMessages.length] ?? dailyMessages[0];
};
