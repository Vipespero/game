import { useRef, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { useAppData }      from '@/hooks/useAppData';
import { useThreeScene }   from '@/hooks/useThreeScene';
import { useTattooStore }  from '@/store/index';
import { TattooPanel }     from '@/components/TattooPanel';
import { CharacterSheet }  from '@/components/CharacterSheet';
import { DesignSheet }     from '@/components/DesignSheet';
import type { PendingTattoo, DecalState } from '@/types/tattoo';
import { nanoid } from 'nanoid';

export default function TattooPage() {
    // ── Carga inicial de datos desde la API ──
    useAppData();

    // ── Store: estado ──
    const characters      = useTattooStore((s) => s.characters);
    const designs         = useTattooStore((s) => s.designs);
    const activeCharacter = useTattooStore((s) => s.activeCharacter);
    const activeDesign    = useTattooStore((s) => s.activeDesign);
    const decals          = useTattooStore((s) => s.decals);
    const pending         = useTattooStore((s) => s.pending);
    const loadingModel    = useTattooStore((s) => s.loadingModel);
    const showCharSheet   = useTattooStore((s) => s.showCharSheet);
    const showDesignSheet = useTattooStore((s) => s.showDesignSheet);

    // ── Store: acciones ──
    const setActiveCharacter = useTattooStore((s) => s.setActiveCharacter);
    const setActiveDesign    = useTattooStore((s) => s.setActiveDesign);
    const setPending         = useTattooStore((s) => s.setPending);
    const patchPending       = useTattooStore((s) => s.patchPending);
    const addDecal           = useTattooStore((s) => s.addDecal);
    const removeDecal        = useTattooStore((s) => s.removeDecal);
    const setLoadingModel    = useTattooStore((s) => s.setLoadingModel);
    const setShowCharSheet   = useTattooStore((s) => s.setShowCharSheet);
    const setShowDesignSheet = useTattooStore((s) => s.setShowDesignSheet);

    // ── Canvas ref ──
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Callback: tap en el modelo ──
    const handleTap = useCallback((p: PendingTattoo) => {
        setPending(p);
    }, [setPending]);

    // ── Three.js ──
    const { clearPreview, removeDecalFromScene } = useThreeScene(containerRef, {
        activeCharacter,
        activeDesign,
        decals,
        pending,
        onTap:       handleTap,
        onLoadStart: () => setLoadingModel(true),
        onLoadEnd:   () => setLoadingModel(false),
    });

    // ── Confirmar tatuaje ──
    const handleApply = useCallback(() => {
        if (!pending || !activeDesign) return;

        const decal: DecalState = {
            id:                 nanoid(),
            designId:           pending.designId,
            designName:         activeDesign.name,
            imageUrl:           pending.imageUrl,
            size:               pending.size,
            rotation:           pending.rotation,
            intersectionPoint:  pending.intersectionPoint,
            intersectionNormal: pending.intersectionNormal,
            meshName:           pending.meshName,
        };

        addDecal(decal);
        setPending(null);
        clearPreview?.();
    }, [pending, activeDesign, addDecal, setPending, clearPreview]);

    // ── Cancelar previsualización ──
    const handleCancel = useCallback(() => {
        setPending(null);
        clearPreview?.();
    }, [setPending, clearPreview]);

    // ── Eliminar decal confirmado ──
    const handleRemove = useCallback((id: string) => {
        removeDecal(id);
        removeDecalFromScene?.(id);
    }, [removeDecal, removeDecalFromScene]);

    return (
        <>
            <Head title="Tattoo Studio" />

            <div className="ts-app">
                {/* ── Topbar ── */}
                <header className="ts-topbar">
                    <span className="ts-topbar__title">
                        TATTOO<span>STUDIO</span>
                    </span>
                    <div className="ts-topbar__actions">
                        <button
                            className="ts-pill-btn"
                            onClick={() => setShowCharSheet(true)}
                        >
                            {activeCharacter?.emoji ?? '👤'} {activeCharacter?.name ?? 'Personaje'}
                        </button>
                        <button
                            className="ts-pill-btn"
                            onClick={() => setShowDesignSheet(true)}
                        >
                            🎨 {activeDesign?.name ?? 'Diseño'}
                        </button>
                    </div>
                </header>

                {/* ── Canvas Three.js ── */}
                <div className="ts-canvas-wrapper" ref={containerRef}>
                    {loadingModel && (
                        <div className="ts-loader">
                            <div className="ts-loader__ring" />
                            <span className="ts-loader__text">CARGANDO MODELO</span>
                        </div>
                    )}

                    {!loadingModel && !pending && decals.length === 0 && (
                        <div className="ts-tap-hint">
                            <div className="ts-tap-hint__ring" />
                            <span className="ts-tap-hint__text">
                                TOCA EL MODELO<br />PARA COLOCAR UN TATUAJE
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Panel de ajuste y lista de decals ── */}
                <TattooPanel
                    pending={pending}
                    decals={decals}
                    onChange={patchPending}
                    onApply={handleApply}
                    onCancel={handleCancel}
                    onRemove={handleRemove}
                />

                {/* ── Sheet de personajes ── */}
                {showCharSheet && (
                    <CharacterSheet
                        characters={characters}
                        activeCharacter={activeCharacter}
                        onSelect={(char) => {
                            setActiveCharacter(char);
                            setShowCharSheet(false);
                        }}
                        onClose={() => setShowCharSheet(false)}
                    />
                )}

                {/* ── Sheet de diseños ── */}
                {showDesignSheet && (
                    <DesignSheet
                        designs={designs}
                        activeDesign={activeDesign}
                        onSelect={(design) => {
                            setActiveDesign(design);
                            setShowDesignSheet(false);
                        }}
                        onClose={() => setShowDesignSheet(false)}
                    />
                )}
            </div>
        </>
    );
}