import { useEffect } from 'react';
import { getCharacters, getDesigns } from '@/api/index';
import { useTattooStore } from '@/store/index';

export function useAppData() {
    const setCharacters      = useTattooStore((s) => s.setCharacters);
    const setDesigns         = useTattooStore((s) => s.setDesigns);
    const setActiveCharacter = useTattooStore((s) => s.setActiveCharacter);
    const setActiveDesign    = useTattooStore((s) => s.setActiveDesign);
    const setLoadingModel    = useTattooStore((s) => s.setLoadingModel);

    useEffect(() => {
        getCharacters()
            .then((chars) => {
                setCharacters(chars);
                if (chars.length > 0) {
                    const randomIndex = Math.floor(Math.random() * chars.length);
                    setActiveCharacter(chars[randomIndex]);
                }
            })
            .catch((err) => console.error('Error cargando personajes:', err));

        getDesigns()
            .then((designs) => {
                setDesigns(designs);
                if (designs.length > 0) setActiveDesign(designs[0]);
            })
            .catch((err) => console.error('Error cargando diseños:', err));
    }, []);
}
