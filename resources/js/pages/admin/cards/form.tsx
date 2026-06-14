import { Head, router, useForm } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';

type CardFormData = {
    external_id: string;
    name: string;
    collection: string;
    rarity: string;
    image_path: string;
    drop_weight: number;
    is_active: boolean;
};

type CardFormProps = {
    card: (CardFormData & { id: number }) | null;
    rarities: string[];
};

export default function CardForm({ card, rarities }: CardFormProps) {
    const form = useForm<CardFormData>({
        external_id: card?.external_id ?? '',
        name: card?.name ?? '',
        collection: card?.collection ?? '',
        rarity: card?.rarity ?? 'R',
        image_path: card?.image_path ?? '',
        drop_weight: card?.drop_weight ?? 100,
        is_active: card?.is_active ?? true,
    });
    const title = card ? 'Editar carta' : 'Nueva carta';

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (card) {
            form.put(`/admin/cards/${card.id}`);

            return;
        }

        form.post('/admin/cards');
    };

    return (
        <>
            <Head title={title} />
            <main className="mm-admin">
                <section className="mm-admin__shell" aria-label={title}>
                    <header className="mm-admin__header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark">
                                <ShieldCheck size={18} aria-hidden />
                            </div>
                            <div>
                                <p className="mm-kicker">Admin</p>
                                <h1>{title}</h1>
                            </div>
                        </div>
                        <div className="mm-admin__actions">
                            <button onClick={() => router.visit('/admin/cards')} type="button">
                                Cartas
                            </button>
                        </div>
                    </header>

                    <section className="mm-admin__panel">
                        <form className="mm-admin__form" onSubmit={submit}>
                            <label>
                                <span>ID externo</span>
                                <input
                                    onChange={(event) => form.setData('external_id', event.target.value)}
                                    placeholder="card-15"
                                    required
                                    type="text"
                                    value={form.data.external_id}
                                />
                                {form.errors.external_id && <small>{form.errors.external_id}</small>}
                            </label>
                            <label>
                                <span>Nombre</span>
                                <input
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    required
                                    type="text"
                                    value={form.data.name}
                                />
                                {form.errors.name && <small>{form.errors.name}</small>}
                            </label>
                            <label>
                                <span>Coleccion</span>
                                <input
                                    onChange={(event) => form.setData('collection', event.target.value)}
                                    required
                                    type="text"
                                    value={form.data.collection}
                                />
                                {form.errors.collection && <small>{form.errors.collection}</small>}
                            </label>
                            <label>
                                <span>Rareza</span>
                                <select onChange={(event) => form.setData('rarity', event.target.value)} value={form.data.rarity}>
                                    {rarities.map((rarity) => (
                                        <option key={rarity} value={rarity}>
                                            {rarity}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.rarity && <small>{form.errors.rarity}</small>}
                            </label>
                            <label>
                                <span>Ruta de imagen</span>
                                <input
                                    onChange={(event) => form.setData('image_path', event.target.value)}
                                    placeholder="SSR/archivo.png"
                                    required
                                    type="text"
                                    value={form.data.image_path}
                                />
                                {form.errors.image_path && <small>{form.errors.image_path}</small>}
                            </label>
                            <label>
                                <span>Peso de drop</span>
                                <input
                                    min={1}
                                    onChange={(event) => form.setData('drop_weight', Number(event.target.value))}
                                    required
                                    type="number"
                                    value={form.data.drop_weight}
                                />
                                {form.errors.drop_weight && <small>{form.errors.drop_weight}</small>}
                            </label>
                            <label className="mm-admin__check">
                                <input
                                    checked={form.data.is_active}
                                    onChange={(event) => form.setData('is_active', event.target.checked)}
                                    type="checkbox"
                                />
                                <span>Activa</span>
                            </label>
                            <button className="mm-auth__submit" disabled={form.processing} type="submit">
                                Guardar
                            </button>
                        </form>
                    </section>
                </section>
            </main>
        </>
    );
}
