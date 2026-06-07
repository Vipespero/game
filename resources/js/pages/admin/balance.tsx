import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { RefreshCcw, Save, ShieldCheck } from 'lucide-react';

type SettingRow = {
    key: string;
    value: string | number;
};

type RarityRow = {
    id: number;
    code: string;
    name: string;
    duplicate_hearts: number;
    sort_order: number;
    is_active: boolean;
};

type MissionRow = {
    id: number;
    external_id: string;
    label: string;
    progress_key: string;
    goal: number;
    reward_hearts: number;
    reward_energy: number;
    sort_order: number;
    is_active: boolean;
};

type MergeItemRow = {
    id: number;
    level: number;
    name: string;
    symbol: string;
    image_path: string | null;
    xp: number;
    hearts: number;
    is_active: boolean;
};

type PackRow = {
    id: number;
    external_id: string;
    label: string;
    trigger_key: string;
    cost_hearts: number;
    cards_count: number;
    sort_order: number;
    is_active: boolean;
};

type BalanceFormData = {
    settings: Array<SettingRow & { value: number }>;
    rarities: RarityRow[];
    missions: MissionRow[];
    mergeItems: MergeItemRow[];
    packs: PackRow[];
};

type BalanceProps = BalanceFormData & {
    ready: boolean;
    progressKeys: string[];
    triggerKeys: string[];
};

const numberValue = (value: string | number | null | undefined) => Number(value ?? 0);

export default function AdminBalance({ ready, settings, rarities, missions, mergeItems, packs, progressKeys, triggerKeys }: BalanceProps) {
    const form = useForm<BalanceFormData>({
        settings: settings.map((setting) => ({ ...setting, value: numberValue(setting.value) })),
        rarities,
        missions,
        mergeItems: mergeItems.map((item) => ({ ...item, image_path: item.image_path ?? '' })),
        packs,
    });

    const setRow = (
        group: keyof BalanceFormData,
        index: number,
        key: string,
        value: string | number | boolean | null,
    ) => {
        form.setData(group, (form.data[group] as Array<Record<string, unknown>>).map((row, rowIndex) => (
            rowIndex === index ? { ...row, [key]: value } : row
        )) as never);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/balance');
    };

    return (
        <>
            <Head title="Balance" />
            <main className="mm-admin">
                <section className="mm-admin__shell" aria-label="Balance">
                    <header className="mm-admin__header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark">
                                <ShieldCheck size={18} aria-hidden />
                            </div>
                            <div>
                                <p className="mm-kicker">Admin</p>
                                <h1>Balance</h1>
                            </div>
                        </div>
                        <div className="mm-admin__actions">
                            <button onClick={() => router.visit('/admin/cards')} type="button">Cartas</button>
                            <button onClick={() => router.visit('/admin')} type="button">Panel</button>
                            <button onClick={() => router.reload()} type="button">
                                <RefreshCcw size={15} aria-hidden />
                            </button>
                        </div>
                    </header>

                    {!ready && (
                        <section className="mm-admin__notice" role="status">
                            <strong>Balance pendiente</strong>
                            <span>Faltan tablas nuevas. Ejecuta migraciones cuando toque desplegar el VPS.</span>
                        </section>
                    )}

                    <form className="mm-admin__balance" onSubmit={submit}>
                        <section className="mm-admin__panel">
                            <div className="mm-admin__panel-head">
                                <div>
                                    <p className="mm-kicker">General</p>
                                    <h2>Configuracion</h2>
                                </div>
                            </div>
                            <div className="mm-admin__table-wrap">
                                <table className="mm-admin__table">
                                    <thead>
                                        <tr>
                                            <th>Clave</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.data.settings.map((setting, index) => (
                                            <tr key={setting.key}>
                                                <td><strong>{setting.key}</strong></td>
                                                <td>
                                                    <input
                                                        min={0}
                                                        onChange={(event) => setRow('settings', index, 'value', numberValue(event.target.value))}
                                                        type="number"
                                                        value={setting.value}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mm-admin__panel">
                            <div className="mm-admin__panel-head">
                                <div>
                                    <p className="mm-kicker">Cartas</p>
                                    <h2>Rarezas</h2>
                                </div>
                            </div>
                            <div className="mm-admin__table-wrap">
                                <table className="mm-admin__table">
                                    <thead>
                                        <tr>
                                            <th>Codigo</th>
                                            <th>Nombre</th>
                                            <th>Duplicado</th>
                                            <th>Orden</th>
                                            <th>Activa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.data.rarities.map((rarity, index) => (
                                            <tr key={rarity.id}>
                                                <td><strong>{rarity.code}</strong></td>
                                                <td><input onChange={(event) => setRow('rarities', index, 'name', event.target.value)} value={rarity.name} /></td>
                                                <td><input min={0} onChange={(event) => setRow('rarities', index, 'duplicate_hearts', numberValue(event.target.value))} type="number" value={rarity.duplicate_hearts} /></td>
                                                <td><input min={0} onChange={(event) => setRow('rarities', index, 'sort_order', numberValue(event.target.value))} type="number" value={rarity.sort_order} /></td>
                                                <td><input checked={rarity.is_active} onChange={(event) => setRow('rarities', index, 'is_active', event.target.checked)} type="checkbox" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mm-admin__panel">
                            <div className="mm-admin__panel-head">
                                <div>
                                    <p className="mm-kicker">Objetivos</p>
                                    <h2>Misiones</h2>
                                </div>
                            </div>
                            <div className="mm-admin__table-wrap">
                                <table className="mm-admin__table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Texto</th>
                                            <th>Progreso</th>
                                            <th>Meta</th>
                                            <th>Corazones</th>
                                            <th>Energia</th>
                                            <th>Orden</th>
                                            <th>Activa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.data.missions.map((mission, index) => (
                                            <tr key={mission.id}>
                                                <td><strong>{mission.external_id}</strong></td>
                                                <td><input onChange={(event) => setRow('missions', index, 'label', event.target.value)} value={mission.label} /></td>
                                                <td>
                                                    <select onChange={(event) => setRow('missions', index, 'progress_key', event.target.value)} value={mission.progress_key}>
                                                        {progressKeys.map((key) => <option key={key} value={key}>{key}</option>)}
                                                    </select>
                                                </td>
                                                <td><input min={1} onChange={(event) => setRow('missions', index, 'goal', numberValue(event.target.value))} type="number" value={mission.goal} /></td>
                                                <td><input min={0} onChange={(event) => setRow('missions', index, 'reward_hearts', numberValue(event.target.value))} type="number" value={mission.reward_hearts} /></td>
                                                <td><input min={0} onChange={(event) => setRow('missions', index, 'reward_energy', numberValue(event.target.value))} type="number" value={mission.reward_energy} /></td>
                                                <td><input min={0} onChange={(event) => setRow('missions', index, 'sort_order', numberValue(event.target.value))} type="number" value={mission.sort_order} /></td>
                                                <td><input checked={mission.is_active} onChange={(event) => setRow('missions', index, 'is_active', event.target.checked)} type="checkbox" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mm-admin__panel">
                            <div className="mm-admin__panel-head">
                                <div>
                                    <p className="mm-kicker">Tablero</p>
                                    <h2>Objetos fusionables</h2>
                                </div>
                            </div>
                            <div className="mm-admin__table-wrap">
                                <table className="mm-admin__table">
                                    <thead>
                                        <tr>
                                            <th>Nivel</th>
                                            <th>Nombre</th>
                                            <th>Simbolo</th>
                                            <th>Imagen</th>
                                            <th>XP</th>
                                            <th>Corazones</th>
                                            <th>Activo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.data.mergeItems.map((item, index) => (
                                            <tr key={item.id}>
                                                <td><strong>{item.level}</strong></td>
                                                <td><input onChange={(event) => setRow('mergeItems', index, 'name', event.target.value)} value={item.name} /></td>
                                                <td>{item.symbol}</td>
                                                <td><input onChange={(event) => setRow('mergeItems', index, 'image_path', event.target.value)} value={item.image_path ?? ''} /></td>
                                                <td><input min={0} onChange={(event) => setRow('mergeItems', index, 'xp', numberValue(event.target.value))} type="number" value={item.xp} /></td>
                                                <td><input min={0} onChange={(event) => setRow('mergeItems', index, 'hearts', numberValue(event.target.value))} type="number" value={item.hearts} /></td>
                                                <td><input checked={item.is_active} onChange={(event) => setRow('mergeItems', index, 'is_active', event.target.checked)} type="checkbox" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mm-admin__panel">
                            <div className="mm-admin__panel-head">
                                <div>
                                    <p className="mm-kicker">Sobres</p>
                                    <h2>Packs</h2>
                                </div>
                            </div>
                            <div className="mm-admin__table-wrap">
                                <table className="mm-admin__table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Disparo</th>
                                            <th>Costo</th>
                                            <th>Cartas</th>
                                            <th>Orden</th>
                                            <th>Activo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.data.packs.map((pack, index) => (
                                            <tr key={pack.id}>
                                                <td><strong>{pack.external_id}</strong></td>
                                                <td><input onChange={(event) => setRow('packs', index, 'label', event.target.value)} value={pack.label} /></td>
                                                <td>
                                                    <select onChange={(event) => setRow('packs', index, 'trigger_key', event.target.value)} value={pack.trigger_key}>
                                                        {triggerKeys.map((key) => <option key={key} value={key}>{key}</option>)}
                                                    </select>
                                                </td>
                                                <td><input min={0} onChange={(event) => setRow('packs', index, 'cost_hearts', numberValue(event.target.value))} type="number" value={pack.cost_hearts} /></td>
                                                <td><input min={1} max={10} onChange={(event) => setRow('packs', index, 'cards_count', numberValue(event.target.value))} type="number" value={pack.cards_count} /></td>
                                                <td><input min={0} onChange={(event) => setRow('packs', index, 'sort_order', numberValue(event.target.value))} type="number" value={pack.sort_order} /></td>
                                                <td><input checked={pack.is_active} onChange={(event) => setRow('packs', index, 'is_active', event.target.checked)} type="checkbox" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <button className="mm-admin__save" disabled={!ready || form.processing} type="submit">
                            <Save size={16} aria-hidden />
                            Guardar balance
                        </button>
                    </form>
                </section>
            </main>
        </>
    );
}
