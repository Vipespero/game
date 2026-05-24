import '@/styles.css';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { BadgeCheck, Palette, Sparkles, Target, Trophy } from 'lucide-react';
import { nanoid } from 'nanoid';
import { TattooPanel } from '@/components/TattooPanel';
import { DesignSheet } from '@/components/DesignSheet';
import { useAppData } from '@/hooks/useAppData';
import { useThreeScene } from '@/hooks/useThreeScene';
import { useTattooStore } from '@/store/index';
import type { DecalState, PendingTattoo, TattooDesign } from '@/types/tattoo';

export default function TattooPage() {
    const tattooGoal = 3;
    const [selectedColor, setSelectedColor] = useState('#d8b36a');
    const [showcaseMode, setShowcaseModeState] = useState(false);

    useAppData();

    const designs = useTattooStore((s) => s.designs);
    const activeCharacter = useTattooStore((s) => s.activeCharacter);
    const activeDesign = useTattooStore((s) => s.activeDesign);
    const decals = useTattooStore((s) => s.decals);
    const pending = useTattooStore((s) => s.pending);
    const loadingModel = useTattooStore((s) => s.loadingModel);
    const showDesignSheet = useTattooStore((s) => s.showDesignSheet);

    const setActiveDesign = useTattooStore((s) => s.setActiveDesign);
    const setPending = useTattooStore((s) => s.setPending);
    const patchPending = useTattooStore((s) => s.patchPending);
    const addDecal = useTattooStore((s) => s.addDecal);
    const removeDecal = useTattooStore((s) => s.removeDecal);
    const setLoadingModel = useTattooStore((s) => s.setLoadingModel);
    const setShowDesignSheet = useTattooStore((s) => s.setShowDesignSheet);

    const gameStep = useMemo(() => {
        if (showcaseMode) {
            return {
                eyebrow: 'Finalizado',
                title: 'Show de tattoos',
                body: 'Camara, luz y movimiento para presentar tu diseno.',
                action: 'Cambiar tattoo',
                progress: 100,
            };
        }

        if (decals.length >= tattooGoal) {
            return {
                eyebrow: 'Reto completo',
                title: 'Estudio listo',
                body: 'Presiona Finalizado para ver la animacion.',
                action: 'Cambiar tattoo',
                progress: 100,
            };
        }

        if (!activeDesign) {
            return {
                eyebrow: 'Paso 1',
                title: 'Elige un tattoo',
                body: 'Selecciona un diseno para empezar.',
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
            body: 'Cambia tamano, giro y color antes de aplicar.',
            action: 'Cambiar tattoo',
            progress: 72 + Math.min(decals.length, tattooGoal) * 8,
        };
    }, [activeDesign, decals.length, pending, showcaseMode]);

    const containerRef = useRef<HTMLDivElement>(null);

    const handleTap = useCallback((p: PendingTattoo) => {
        if (showcaseMode) return;
        setPending(p);
    }, [setPending, showcaseMode]);

    const { clearPreview, removeDecalFromScene, setShowcaseMode } = useThreeScene(containerRef, {
        activeCharacter,
        activeDesign,
        decals,
        pending,
        selectedColor,
        showcaseMode,
        onTap: handleTap,
        onLoadStart: () => setLoadingModel(true),
        onLoadEnd: () => setLoadingModel(false),
    });

    const handlePrimaryAction = useCallback(() => {
        setShowcaseModeState(false);
        setShowcaseMode(false);
        setShowDesignSheet(true);
    }, [setShowDesignSheet, setShowcaseMode]);

    const handleApply = useCallback(() => {
        if (!pending || !activeDesign) return;

        const decal: DecalState = {
            id: nanoid(),
            designId: pending.designId,
            designName: activeDesign.name,
            imageUrl: pending.imageUrl,
            color: pending.color,
            size: pending.size,
            rotation: pending.rotation,
            intersectionPoint: pending.intersectionPoint,
            intersectionNormal: pending.intersectionNormal,
            meshName: pending.meshName,
        };

        addDecal(decal);
        setPending(null);
        setShowcaseModeState(false);
        setShowcaseMode(false);
        clearPreview?.();
    }, [activeDesign, addDecal, clearPreview, pending, setPending, setShowcaseMode]);

    const handleCancel = useCallback(() => {
        setPending(null);
        clearPreview?.();
    }, [clearPreview, setPending]);

    const handleRemove = useCallback((id: string) => {
        removeDecal(id);
        removeDecalFromScene?.(id);
    }, [removeDecal, removeDecalFromScene]);

    const handleSelectDesign = useCallback((design: TattooDesign) => {
        setShowcaseModeState(false);
        setShowcaseMode(false);
        setPending(null);
        clearPreview?.();
        setActiveDesign(design);
        setShowDesignSheet(false);
    }, [clearPreview, setActiveDesign, setPending, setShowDesignSheet, setShowcaseMode]);

    const handleFinish = useCallback(() => {
        setPending(null);
        clearPreview?.();
        setShowcaseModeState(true);
        setShowcaseMode(true);
    }, [clearPreview, setPending, setShowcaseMode]);

    return (
        <>
            <Head title="Tattoo Studio" />

            <div className="ts-app">
                <header className="ts-topbar">
                    <span className="ts-topbar__title">
                        TATTOO<span>STUDIO</span>
                    </span>
                    <div className="ts-topbar__actions">
                        <div className="ts-random-chip" aria-label="Modelo aleatorio">
                            <Sparkles size={15} aria-hidden />
                            <span>{activeCharacter?.name ?? 'Aleatorio'}</span>
                        </div>
                        <button
                            className="ts-pill-btn"
                            onClick={handlePrimaryAction}
                            aria-label="Elegir tattoo"
                        >
                            <Palette size={15} aria-hidden />
                            <span>{activeDesign?.name ?? 'Tattoo'}</span>
                        </button>
                    </div>
                </header>

                <div className={`ts-canvas-wrapper ${showcaseMode ? 'ts-canvas-wrapper--showcase' : ''}`} ref={containerRef}>
                    <section className="ts-game-hud" aria-live="polite">
                        <div className="ts-mission">
                            <div className="ts-mission__icon">
                                {showcaseMode || decals.length >= tattooGoal ? (
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

                    {!loadingModel && !pending && decals.length === 0 && !showcaseMode && (
                        <div className="ts-tap-hint">
                            <div className="ts-tap-hint__ring" />
                            <span className="ts-tap-hint__text">
                                Toca el modelo<br />para colocar el primer tattoo
                            </span>
                        </div>
                    )}

                    {showcaseMode && (
                        <div className="ts-win-toast">
                            <BadgeCheck size={18} aria-hidden />
                            Resultado final
                        </div>
                    )}
                </div>

                {!showcaseMode && (
                    <TattooPanel
                        pending={pending}
                        decals={decals}
                        onChange={(patch) => {
                            if (patch.color) setSelectedColor(patch.color);
                            patchPending(patch);
                        }}
                        onApply={handleApply}
                        onCancel={handleCancel}
                        onRemove={handleRemove}
                        onFinish={handleFinish}
                    />
                )}

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
