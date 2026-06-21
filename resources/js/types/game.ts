export type BoardItem = {
    id: string;
    level: number;
};

export type CardRarity = 'C' | 'R' | 'SR' | 'SSR' | 'UR' | 'SECRET';

export type MelodyCard = {
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

export type CollagePhoto = {
    id: number;
    label: string;
    url: string;
    piecesCount: number;
};

export type CollagePieceReward = {
    id: string;
    photoId: number;
    pieceIndex: number;
    label: string;
    imageUrl: string;
};

export type MergeItemDefinition = {
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

export type MergeItemSource = Omit<MergeItemDefinition, 'imageUrl'>;

export type CardRarityDefinition = {
    code: CardRarity;
    name: string;
    duplicateHearts: number;
    sortOrder: number;
    isActive: boolean;
};

export type GameConfig = {
    maxEnergy: number;
    dailyRewardEnergy: number;
    dailyRewardHearts: number;
};

export type GameRules = {
    magicBoxPrimaryLevel: number;
    magicBoxBonusLevel: number;
    magicBoxBonusChancePercent: number;
    mergePackMinLevel: number;
    mergePackChancePercent: number;
};

export type GamePackDefinition = {
    id: string;
    label: string;
    triggerKey: 'premium' | 'daily' | 'level' | 'merge';
    costHearts: number;
    cardsCount: number;
    sortOrder?: number;
    isActive?: boolean;
};

export type MissionDefinition = {
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

export type PlayerLevelDefinition = {
    level: number;
    xpRequired: number;
    rewardEnergy: number;
    rewardPackTrigger: GamePackDefinition['triggerKey'] | null;
    isActive: boolean;
};

export type MelodyTab = 'merge' | 'blocks' | 'album' | 'room' | 'memory';

export type BlockPiece = {
    id: string;
    shapeId: string;
    color: number;
};

export type PackReward = {
    id: string;
    label: string;
    cards: MelodyCard[];
    collagePieces?: CollagePieceReward[];
};

export type PackCardResult = {
    status: 'new' | 'duplicate';
    bonusHearts: number;
};

export type SavedPackReward = {
    id: string;
    label: string;
    cards: string[];
};

export type MemoryCard = {
    id: string;
    pairId: string;
    item: MergeItemDefinition;
    isMatched: boolean;
};

export type MelodyGameSave = {
    board?: Array<BoardItem | null>;
    energy?: number;
    hearts?: number;
    xp?: number;
    playerLevel?: number;
    mergeCount?: number;
    openedPacks?: SavedPackReward[];
    collagePieces?: string[];
    blockBoard?: number[];
    blockPieces?: BlockPiece[];
    blockScore?: number;
    blockBest?: number;
    blockCombo?: number;
    activeTab?: MelodyTab;
    claimedMissions?: string[];
    dailyRewardClaimedAt?: string | null;
    lastSeenAt?: string | null;
};

export type MelodyMergePageProps = {
    cards: Array<Omit<MelodyCard, 'imageUrl'>>;
    cardRarities?: CardRarityDefinition[];
    collagePhotos?: CollagePhoto[];
    gameConfig?: GameConfig;
    gamePacks?: GamePackDefinition[];
    gameRules?: GameRules;
    mergeItems?: MergeItemSource[];
    missions?: MissionDefinition[];
    musicTracks?: string[];
    playerLevels?: PlayerLevelDefinition[];
    gameSave?: MelodyGameSave | null;
    auth?: {
        user?: {
            email?: string;
            id?: number;
            is_admin?: boolean;
            name?: string;
        } | null;
    };
};
