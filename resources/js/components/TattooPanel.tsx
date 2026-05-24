import type { DecalState, PendingTattoo } from '@/types/tattoo';

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
                        <span className="ts-panel__title">AJUSTAR TATUAJE</span>
                        <span className="ts-panel__hint">PREVISUALIZACIÓN</span>
                    </div>

                    <div className="ts-ctrl-row">
                        <span className="ts-ctrl-label">TAMAÑO</span>
                        <input
                            type="range" min={0.1} max={3.0} step={0.05}
                            value={pending.size}
                            onChange={(e) => onChange({ size: parseFloat(e.target.value) })}
                        />
                        <span className="ts-ctrl-value">{pending.size.toFixed(2)}</span>
                    </div>

                    <div className="ts-ctrl-row">
                        <span className="ts-ctrl-label">ROTAR</span>
                        <input
                            type="range" min={0} max={360} step={1}
                            value={pending.rotation}
                            onChange={(e) => onChange({ rotation: parseFloat(e.target.value) })}
                        />
                        <span className="ts-ctrl-value">{Math.round(pending.rotation)}°</span>
                    </div>

                    <div className="ts-panel__actions">
                        <button className="ts-btn ts-btn--cancel" onClick={onCancel}>✕ CANCELAR</button>
                        <button className="ts-btn ts-btn--apply"  onClick={onApply}>✓ APLICAR</button>
                    </div>
                </>
            )}

            {decals.length > 0 && (
                <div className="ts-decal-list">
                    <p className="ts-decal-list__title">
                        TATUAJES APLICADOS ({decals.length})
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
                            >✕</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}