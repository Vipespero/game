import type { TattooDesign } from '@/types/tattoo';
import { Check } from 'lucide-react';

interface Props {
    designs:       TattooDesign[];
    activeDesign:  TattooDesign | null;
    onSelect:      (d: TattooDesign) => void;
    onClose:       () => void;
}

export function DesignSheet({ designs, activeDesign, onSelect, onClose }: Props) {
    return (
        <div className="ts-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ts-sheet">
                <div className="ts-sheet__handle" />
                <p className="ts-sheet__title">Elige el tattoo</p>
                <ul className="ts-sheet__list ts-sheet__list--designs">
                    {designs.map((d) => (
                        <li
                            key={d.id}
                            className={`ts-design-item ${d.id === activeDesign?.id ? 'ts-design-item--active' : ''}`}
                            onClick={() => onSelect(d)}
                        >
                            <div className="ts-design-item__thumb">
                                <img src={d.image_url} alt={d.name} />
                            </div>
                            <div className="ts-design-item__info">
                                <p className="ts-design-item__name">{d.name}</p>
                                <p className="ts-design-item__cat">{d.category.toUpperCase()}</p>
                            </div>
                            {d.id === activeDesign?.id && (
                                <span className="ts-badge ts-badge--gold">
                                    <Check size={14} aria-hidden />
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
