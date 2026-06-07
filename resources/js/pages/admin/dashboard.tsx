import { Head, router } from '@inertiajs/react';
import { BarChart3, Crown, Heart, LogOut, RefreshCcw, ShieldCheck, Sparkles, Users } from 'lucide-react';

type AdminStats = {
    users: number;
    admins: number;
    saves: number;
    activeToday: number;
    totalHearts: number;
    totalMerges: number;
    totalCards: number;
    catalogCards: number;
    activeCards: number;
};

type PlayerRow = {
    id: number | null;
    name: string;
    email: string;
    isAdmin: boolean;
    hearts: number;
    energy: number;
    level: number;
    merges: number;
    cards: number;
    activeTab: string;
    updatedAt: string | null;
};

type AdminDashboardProps = {
    stats: AdminStats;
    catalogReady: boolean;
    players: PlayerRow[];
};

const statCards = (stats: AdminStats) => [
    { label: 'Usuarios', value: stats.users, icon: Users },
    { label: 'Admins', value: stats.admins, icon: ShieldCheck },
    { label: 'Partidas', value: stats.saves, icon: Sparkles },
    { label: 'Activos 24h', value: stats.activeToday, icon: RefreshCcw },
    { label: 'Corazones', value: stats.totalHearts, icon: Heart },
    { label: 'Fusiones', value: stats.totalMerges, icon: BarChart3 },
    { label: 'Cartas', value: stats.totalCards, icon: Crown },
    { label: 'Catalogo', value: stats.catalogCards, icon: Crown },
    { label: 'Activas', value: stats.activeCards, icon: Sparkles },
];

export default function AdminDashboard({ stats, catalogReady, players }: AdminDashboardProps) {
    return (
        <>
            <Head title="Admin" />
            <main className="mm-admin">
                <section className="mm-admin__shell" aria-label="Panel de administrador">
                    <header className="mm-admin__header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark">
                                <ShieldCheck size={18} aria-hidden />
                            </div>
                            <div>
                                <p className="mm-kicker">Melody Merge</p>
                                <h1>Admin</h1>
                            </div>
                        </div>
                        <div className="mm-admin__actions">
                            <button onClick={() => router.visit('/admin/balance')} type="button">
                                Balance
                            </button>
                            <button onClick={() => router.visit('/admin/cards')} type="button">
                                Cartas
                            </button>
                            <button onClick={() => router.visit('/')} type="button">
                                Juego
                            </button>
                            <button onClick={() => router.post('/logout')} type="button">
                                <LogOut size={15} aria-hidden />
                            </button>
                        </div>
                    </header>

                    <section className="mm-admin__stats" aria-label="Metricas">
                        {statCards(stats).map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <article className="mm-admin__stat" key={stat.label}>
                                    <Icon size={17} aria-hidden />
                                    <span>{stat.label}</span>
                                    <strong>{stat.value.toLocaleString()}</strong>
                                </article>
                            );
                        })}
                    </section>

                    {!catalogReady && (
                        <section className="mm-admin__notice" role="status">
                            <strong>Catalogo pendiente</strong>
                            <span>Falta crear la tabla cards en MySQL. Ejecuta php artisan migrate --force en el VPS.</span>
                        </section>
                    )}

                    <section className="mm-admin__panel">
                        <div className="mm-admin__panel-head">
                            <div>
                                <p className="mm-kicker">Jugadores</p>
                                <h2>Partidas recientes</h2>
                            </div>
                            <button onClick={() => router.reload()} type="button">
                                <RefreshCcw size={15} aria-hidden />
                                Actualizar
                            </button>
                        </div>

                        <div className="mm-admin__table-wrap">
                            <table className="mm-admin__table">
                                <thead>
                                    <tr>
                                        <th>Jugador</th>
                                        <th>Nivel</th>
                                        <th>Corazones</th>
                                        <th>Energia</th>
                                        <th>Cartas</th>
                                        <th>Fusiones</th>
                                        <th>Vista</th>
                                        <th>Guardado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player) => (
                                        <tr key={`${player.id ?? 'deleted'}-${player.email}`}>
                                            <td>
                                                <strong>{player.name}</strong>
                                                <span>{player.email || 'sin email'}</span>
                                                {player.isAdmin && <em>admin</em>}
                                            </td>
                                            <td>{player.level}</td>
                                            <td>{player.hearts.toLocaleString()}</td>
                                            <td>{player.energy}</td>
                                            <td>{player.cards}</td>
                                            <td>{player.merges.toLocaleString()}</td>
                                            <td>{player.activeTab}</td>
                                            <td>{player.updatedAt ?? 'sin fecha'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </section>
            </main>
        </>
    );
}
