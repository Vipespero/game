import { Head, router } from '@inertiajs/react';
import { Edit3, Plus, Power, RefreshCcw, ShieldCheck } from 'lucide-react';

type CardRow = {
    id: number;
    external_id: string;
    name: string;
    collection: string;
    rarity: string;
    image_path: string;
    drop_weight: number;
    is_active: boolean;
};

type AdminCardsProps = {
    cards: CardRow[];
    catalogReady: boolean;
};

export default function AdminCards({ cards, catalogReady }: AdminCardsProps) {
    return (
        <>
            <Head title="Cartas" />
            <main className="mm-admin">
                <section className="mm-admin__shell" aria-label="Cartas">
                    <header className="mm-admin__header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark">
                                <ShieldCheck size={18} aria-hidden />
                            </div>
                            <div>
                                <p className="mm-kicker">Admin</p>
                                <h1>Cartas</h1>
                            </div>
                        </div>
                        <div className="mm-admin__actions">
                            <button onClick={() => router.visit('/admin/cards/create')} type="button">
                                <Plus size={15} aria-hidden />
                                Nueva
                            </button>
                            <button onClick={() => router.visit('/admin')} type="button">
                                Panel
                            </button>
                        </div>
                    </header>

                    {!catalogReady && (
                        <section className="mm-admin__notice" role="status">
                            <strong>Tabla cards no encontrada</strong>
                            <span>Primero ejecuta php artisan migrate --force en el VPS y luego vuelve a cargar esta pantalla.</span>
                        </section>
                    )}

                    <section className="mm-admin__panel">
                        <div className="mm-admin__panel-head">
                            <div>
                                <p className="mm-kicker">Coleccion</p>
                                <h2>{cards.length} cartas</h2>
                            </div>
                            <button onClick={() => router.reload()} type="button">
                                <RefreshCcw size={15} aria-hidden />
                                Actualizar
                            </button>
                        </div>

                        <div className="mm-admin__list">
                            {cards.map((card) => (
                                <article className="mm-admin__edit-card" key={card.id}>
                                    <div className="mm-admin__card-head">
                                        <strong>{card.name}</strong>
                                        <span>{card.is_active ? 'Activa' : 'Inactiva'}</span>
                                    </div>
                                    <div className="mm-admin__meta-grid">
                                        <span>ID <strong>{card.external_id}</strong></span>
                                        <span>Rareza <strong>{card.rarity}</strong></span>
                                        <span>Peso <strong>{card.drop_weight}</strong></span>
                                        <span>Coleccion <strong>{card.collection}</strong></span>
                                    </div>
                                    <p className="mm-admin__path">{card.image_path}</p>
                                    <div className="mm-admin__row-actions">
                                        <button onClick={() => router.visit(`/admin/cards/${card.id}/edit`)} type="button">
                                            <Edit3 size={14} aria-hidden />
                                            Editar
                                        </button>
                                        <button disabled={!card.is_active} onClick={() => router.delete(`/admin/cards/${card.id}`)} type="button">
                                            <Power size={14} aria-hidden />
                                            Desactivar
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </section>
            </main>
        </>
    );
}
