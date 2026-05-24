import '@/styles.css';

import { useRef, useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { BadgeCheck, Palette, Target, Trophy, UserRound } from 'lucide-react';
import { useAppData }      from '@/hooks/useAppData';
import { useThreeScene }   from '@/hooks/useThreeScene';
import { useTattooStore }  from '@/store/index';
import { TattooPanel }     from '@/components/TattooPanel';
import { CharacterSheet }  from '@/components/CharacterSheet';
import { DesignSheet }     from '@/components/DesignSheet';
import type { PendingTattoo, DecalState } from '@/types/tattoo';
import { nanoid } from 'nanoid';

export default function TattooPage() {
    const tattooGoal = 3;

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
    const clearDecals        = useTattooStore((s) => s.clearDecals);
    const setLoadingModel    = useTattooStore((s) => s.setLoadingModel);
    const setShowCharSheet   = useTattooStore((s) => s.setShowCharSheet);
    const setShowDesignSheet = useTattooStore((s) => s.setShowDesignSheet);

    const gameStep = useMemo(() => {
        if (decals.length >= tattooGoal) {
            return {
                eyebrow: 'Reto completo',
                title: 'Estudio listo',
                body: 'Puedes quitar uno o seguir creando combinaciones.',
                action: 'Crear otro',
                progress: 100,
            };
        }

        if (!activeDesign) {
            return {
                eyebrow: 'Paso 1',
                title: 'Elige un tattoo',
                body: 'Selecciona un diseño para empezar.',
                action: 'Elegir tattoo',
                progress: 12,
            };
        }

        if (!pending) {
            return {
                eyebrow: 'Paso 2',
                title: 'Toca el modelo',
                body: 'Busca una zona y coloca la vista previa.',
                action: 'Cambiar tattoo',
                progress: 42 + Math.min(decals.length, tattooGoal) * 14,
            };
        }

        return {
            eyebrow: 'Paso 3',
            title: 'Ajusta el tattoo',
            body: 'Cambia tamaño y giro antes de aplicar.',
            action: 'Cambiar tattoo',
            progress: 72 + Math.min(decals.length, tattooGoal) * 8,
        };
    }, [activeDesign, decals.length, pending]);

    const handlePrimaryAction = useCallback(() => {
        if (decals.length >= tattooGoal && !pending) {
            setPending(null);
            setShowDesignSheet(true);
            return;
        }

        setShowDesignSheet(true);
    }, [decals.length, pending, setPending, setShowDesignSheet]);

    // ── Canvas ref ──
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Callback: tap en el modelo ──
    const handleTap = useCallback((p: PendingTattoo) => {
        setPending(p);
    }, [setPending]);

    // ── Three.js ──
    const { clearPreview, clearDecalsFromScene, removeDecalFromScene } = useThreeScene(containerRef, {
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

    const handleSelectCharacter = useCallback((char: NonNullable<typeof activeCharacter>) => {
        clearDecals();
        clearDecalsFromScene?.();
        setPending(null);
        clearPreview?.();
        setActiveCharacter(char);
        setShowCharSheet(false);
    }, [clearDecals, clearDecalsFromScene, clearPreview, setActiveCharacter, setPending, setShowCharSheet]);

    const handleSelectDesign = useCallback((design: NonNullable<typeof activeDesign>) => {
        setPending(null);
        clearPreview?.();
        setActiveDesign(design);
        setShowDesignSheet(false);
    }, [clearPreview, setActiveDesign, setPending, setShowDesignSheet]);

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
                            aria-label="Elegir personaje"
                        >
                            <UserRound size={15} aria-hidden />
                            <span>{activeCharacter?.name ?? 'Lienzo'}</span>
                        </button>
                        <button
                            className="ts-pill-btn"
                            onClick={() => setShowDesignSheet(true)}
                            aria-label="Elegir tattoo"
                        >
                            <Palette size={15} aria-hidden />
                            <span>{activeDesign?.name ?? 'Tattoo'}</span>
                        </button>
                    </div>
                </header>

                {/* ── Canvas Three.js ── */}
                <div className="ts-canvas-wrapper" ref={containerRef}>
                    <section className="ts-game-hud" aria-live="polite">
                        <div className="ts-mission">
                            <div className="ts-mission__icon">
                                {decals.length >= tattooGoal ? (
                                    <Trophy size={19} aria-hidden />
                                ) : (
                                    <Target size={19} aria-hidden />
                                )}
                            </div>
                            <div className="ts-mission__copy">
                                <span className="ts-mission__eyebrow">{gameStep.eyebrow}</span>
                                <strong className="ts-mission__title">{gameStep.title}</strong>
                                <span className="ts-mission__body">{gameStep.body}</span>
                            </div>
                            <button
                                type="button"
                                className="ts-mission__action"
                                onClick={handlePrimaryAction}
                            >
                                {gameStep.action}
                            </button>
                        </div>

                        <div className="ts-progress">
                            <div className="ts-progress__meta">
                                <span>Meta</span>
                                <strong>{Math.min(decals.length, tattooGoal)}/{tattooGoal}</strong>
                            </div>
                            <div className="ts-progress__track">
                                <span style={{ width: `${gameStep.progress}%` }} />
                            </div>
                        </div>
                    </section>

                    {loadingModel && (
                        <div className="ts-loader">
                            <div className="ts-loader__ring" />
                            <span className="ts-loader__text">Cargando lienzo</span>
                        </div>
                    )}

                    {!loadingModel && !pending && decals.length === 0 && (
                        <div className="ts-tap-hint">
                            <div className="ts-tap-hint__ring" />
                            <span className="ts-tap-hint__text">
                                Toca el modelo<br />para colocar el primer tattoo
                            </span>
                        </div>
                    )}

                    {decals.length >= tattooGoal && !pending && (
                        <div className="ts-win-toast">
                            <BadgeCheck size={18} aria-hidden />
                            Reto completado
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
                        onSelect={handleSelectCharacter}
                        onClose={() => setShowCharSheet(false)}
                    />
                )}

                {/* ── Sheet de diseños ── */}
                {showDesignSheet && (
                    <DesignSheet
                        designs={designs}
                        activeDesign={activeDesign}
                        onSelect={handleSelectDesign}
                        onClose={() => setShowDesignSheet(false)}
                    />
                )}
            </div>
        </>
    );
}
