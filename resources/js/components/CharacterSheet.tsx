import type { Character } from '@/types/tattoo';

interface Props {
    characters:      Character[];
    activeCharacter: Character | null;
    onSelect:        (c: Character) => void;
    onClose:         () => void;
}

export function CharacterSheet({ characters, activeCharacter, onSelect, onClose }: Props) {
    return (
        <div className="ts-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ts-sheet">
                <div className="ts-sheet__handle" />
                <p className="ts-sheet__title">SELECCIONA PERSONAJE</p>
                <ul className="ts-sheet__list">
                    {characters.map((char) => (
                        <li
                            key={char.id}
                            className={`ts-char-item ${char.id === activeCharacter?.id ? 'ts-char-item--active' : ''}`}
                            onClick={() => onSelect(char)}
                        >
                            <span className="ts-char-item__avatar">{char.emoji}</span>
                            <div className="ts-char-item__info">
                                <p className="ts-char-item__name">{char.name}</p>
                                <p className="ts-char-item__sub">{char.description}</p>
                            </div>
                            <span className="ts-badge">GLB</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}