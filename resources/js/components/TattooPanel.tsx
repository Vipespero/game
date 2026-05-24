import type { DecalState, PendingTattoo } from '@/types/tattoo';
import { Check, RotateCcw, Ruler, Trash2, X } from 'lucide-react';

interface Props {
    pending:   PendingTattoo | null;
    decals:    DecalState[];
    onChange:  (patch: Partial<PendingTattoo>) => void;
    onApply:   () => void;
    onCancel:  () => void;
    onRemove:  (id: string) => void;
}

export function TattooPanel({ pending, decals, onChange, onApply, onCancel, onRemove }: Props) {
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
                        <span className="ts-ctrl-value">{Math.round(pending.rotation)}°</span>
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
                    <p className="ts-decal-list__title">
                        Tattoos aplicados ({decals.length})
                    </p>
                    {decals.map((d, i) => (
                        <div key={d.id} className="ts-decal-row">
                            <div className="ts-decal-row__thumb">
                                <img src={d.imageUrl} alt={d.designName} />
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
