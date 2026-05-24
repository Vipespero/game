import axios from 'axios';
import type { Character, TattooDesign } from '@/types/tattoo';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Accept':           'application/json',
        'Content-Type':     'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    withXSRFToken:   true,
});

export const getCharacters = async (): Promise<Character[]> => {
    const { data } = await api.get<{ data: Character[] }>('/characters');
    return data.data;
};

export const getDesigns = async (): Promise<TattooDesign[]> => {
    const { data } = await api.get<{ data: TattooDesign[] }>('/designs');
    return data.data;
};