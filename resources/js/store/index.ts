import { create } from 'zustand';
import type { Character, TattooDesign, DecalState, PendingTattoo } from '@/types/tattoo';

interface TattooStore {
    // ── Listas ──
    characters:      Character[];
    designs:         TattooDesign[];

    // ── Selección activa ──
    activeCharacter: Character | null;
    activeDesign:    TattooDesign | null;

    // ── Decals en escena ──
    decals:          DecalState[];

    // ── Tatuaje en previsualización ──
    pending:         PendingTattoo | null;

    // ── UI ──
    loadingModel:    boolean;
    showTattooPanel: boolean;
    showCharSheet:   boolean;
    showDesignSheet: boolean;

    // ── Acciones: listas ──
    setCharacters:      (characters: Character[]) => void;
    setDesigns:         (designs: TattooDesign[]) => void;

    // ── Acciones: selección ──
    setActiveCharacter: (character: Character | null) => void;
    setActiveDesign:    (design: TattooDesign | null) => void;

    // ── Acciones: decals ──
    addDecal:           (decal: DecalState) => void;
    removeDecal:        (id: string) => void;
    clearDecals:        () => void;

    // ── Acciones: pending ──
    setPending:         (pending: PendingTattoo | null) => void;
    patchPending:       (patch: Partial<PendingTattoo>) => void;

    // ── Acciones: UI ──
    setLoadingModel:    (value: boolean) => void;
    setShowTattooPanel: (value: boolean) => void;
    setShowCharSheet:   (value: boolean) => void;
    setShowDesignSheet: (value: boolean) => void;
}

export const useTattooStore = create<TattooStore>((set) => ({
    // ── Estado inicial ──
    characters:      [],
    designs:         [],
    activeCharacter: null,
    activeDesign:    null,
    decals:          [],
    pending:         null,
    loadingModel:    false,
    showTattooPanel: false,
    showCharSheet:   false,
    showDesignSheet: false,

    // ── Implementaciones ──
    setCharacters:      (characters) => set({ characters }),
    setDesigns:         (designs) => set({ designs }),

    setActiveCharacter: (activeCharacter) => set({ activeCharacter }),
    setActiveDesign:    (activeDesign) => set({ activeDesign }),

    addDecal: (decal) =>
        set((s) => ({ decals: [...s.decals, decal] })),

    removeDecal: (id) =>
        set((s) => ({ decals: s.decals.filter((d) => d.id !== id) })),

    clearDecals: () => set({ decals: [] }),

    setPending:   (pending) => set({ pending }),

    patchPending: (patch) =>
        set((s) => ({
            pending: s.pending ? { ...s.pending, ...patch } : null,
        })),

    setLoadingModel:    (loadingModel)    => set({ loadingModel }),
    setShowTattooPanel: (showTattooPanel) => set({ showTattooPanel }),
    setShowCharSheet:   (showCharSheet)   => set({ showCharSheet }),
    setShowDesignSheet: (showDesignSheet) => set({ showDesignSheet }),
}));
