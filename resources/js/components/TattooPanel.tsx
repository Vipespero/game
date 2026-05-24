import type { DecalState, PendingTattoo } from '@/types/tattoo';
import { Check, Flag, RotateCcw, Ruler, Trash2, X } from 'lucide-react';

const COLOR_OPTIONS = ['#111111', '#d8b36a', '#48c7b8', '#ee716d', '#ffffff', '#8f7cff'];

interface Props {
    pending:   PendingTattoo | null;
    decals:    DecalState[];
    onChange:  (patch: Partial<PendingTattoo>) => void;
    onApply:   () => void;
    onCancel:  () => void;
    onRemove:  (id: string) => void;
    onFinish:  () => void;
}

export function TattooPanel({ pending, decals, onChange, onApply, onCancel, onRemove, onFinish }: Props) {
    if (!pending && decals.length === 0) return null;

    return (
        <div className="ts-panel">
            {pending && (
                <>
                    <div className="ts-panel__header">
                        <span className="ts-panel__eyebrow">Paso 3</span>
                        <span className="ts-panel__title">Ajusta y confirma</span>
                    </div>

                    <div className="ts-ctrl-row">
                        <span className="ts-ctrl-label">
                            <Ruler size={15} aria-hidden />
                            Tamano
                        </span>
                        <input
                            aria-label="Tamano del tatuaje"
                            type="range" min={0.1} max={3.0} step={0.05}
                            value={pending.size}
                            onChange={(e) => onChange({ size: parseFloat(e.target.value) })}
                        />
                        <span className="ts-ctrl-value">{pending.size.toFixed(2)}</span>
                    </div>

                    <div className="ts-ctrl-row">
                        <span className="ts-ctrl-label">
                            <RotateCcw size={15} aria-hidden />
                            Giro
                        </span>
                        <input
                            aria-label="Rotacion del tatuaje"
                            type="range" min={0} max={360} step={1}
                            value={pending.rotation}
                            onChange={(e) => onChange({ rotation: parseFloat(e.target.value) })}
                        />
                        <span className="ts-ctrl-value">{Math.round(pending.rotation)}&deg;</span>
                    </div>

                    <div className="ts-color-row">
                        <span className="ts-ctrl-label">Color</span>
                        <div className="ts-color-options" aria-label="Color del tattoo">
                            {COLOR_OPTIONS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`ts-color-swatch ${pending.color === color ? 'ts-color-swatch--active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => onChange({ color })}
                                    aria-label={`Usar color ${color}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="ts-panel__actions">
                        <button className="ts-btn ts-btn--cancel" onClick={onCancel}>
                            <X size={18} aria-hidden />
                            Cancelar
                        </button>
                        <button className="ts-btn ts-btn--apply" onClick={onApply}>
                            <Check size={20} aria-hidden />
                            Aplicar tattoo
                        </button>
                    </div>
                </>
            )}

            {decals.length > 0 && (
                <div className="ts-decal-list">
                    {!pending && (
                        <button className="ts-finish-btn" onClick={onFinish}>
                            <Flag size={18} aria-hidden />
                            Finalizado
                        </button>
                    )}
                    <p className="ts-decal-list__title">
                        Tattoos aplicados ({decals.length})
                    </p>
                    {decals.map((d, i) => (
                        <div key={d.id} className="ts-decal-row">
                            <div className="ts-decal-row__thumb">
                                <img src={d.imageUrl} alt={d.designName} style={{ backgroundColor: d.color }} />
                            </div>
                            <span className="ts-decal-row__name">{d.designName} #{i + 1}</span>
                            <button
                                className="ts-decal-row__remove"
                                onClick={() => onRemove(d.id)}
                                aria-label={`Quitar ${d.designName}`}
                            >
                                <Trash2 size={16} aria-hidden />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
