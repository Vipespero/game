import { Head, router, useForm } from '@inertiajs/react';
import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { RefreshCcw, Save, ShieldCheck } from 'lucide-react';

type SettingRow = { key: string; value: string | number };
type RarityRow = { id: number; code: string; name: string; duplicate_hearts: number; sort_order: number; is_active: boolean };
type MissionRow = { id: number; external_id: string; label: string; progress_key: string; goal: number; reward_hearts: number; reward_energy: number; sort_order: number; is_active: boolean };
type MergeItemRow = {
    id: number;
    level: number;
    name: string;
    symbol: string;
    image_path: string | null;
    background_style: string | null;
    border_radius: string;
    image_size: number;
    image_offset_x: number;
    image_offset_y: number;
    xp: number;
    hearts: number;
    is_active: boolean;
};
type PackRow = { id: number; external_id: string; label: string; trigger_key: string; cost_hearts: number; cards_count: number; sort_order: number; is_active: boolean };
type PlayerLevelRow = { id: number; level: number; xp_required: number; reward_energy: number; reward_pack_trigger: string | null; is_active: boolean };

type BalanceFormData = {
    settings: Array<SettingRow & { value: number }>;
    rules: Array<SettingRow & { value: number }>;
    rarities: RarityRow[];
    missions: MissionRow[];
    mergeItems: MergeItemRow[];
    packs: PackRow[];
    playerLevels: PlayerLevelRow[];
};

type BalanceProps = BalanceFormData & {
    ready: boolean;
    progressKeys: string[];
    triggerKeys: string[];
};

type BalanceMenu = keyof BalanceFormData;

const numberValue = (value: string | number | null | undefined) => Number(value ?? 0);

const labels: Record<string, string> = {
    daily_reward_energy: 'Energia diaria',
    daily_reward_hearts: 'Corazones diarios',
    max_energy: 'Energia maxima',
    magic_box_primary_level: 'Nivel base de caja',
    magic_box_bonus_level: 'Nivel bonus de caja',
    magic_box_bonus_chance_percent: 'Probabilidad bonus %',
    merge_pack_chance_percent: 'Probabilidad sobre fusion %',
    merge_pack_min_level: 'Nivel minimo sobre fusion',
};

const help: Record<string, string> = {
    daily_reward_energy: 'Energia que recibe el jugador con la recompensa diaria.',
    daily_reward_hearts: 'Corazones que recibe el jugador con la recompensa diaria.',
    max_energy: 'Limite superior de energia del jugador.',
    magic_box_primary_level: 'Objeto normal que aparece al tocar la caja magica.',
    magic_box_bonus_level: 'Objeto raro que puede salir de la caja magica.',
    magic_box_bonus_chance_percent: 'Porcentaje de probabilidad para que salga el objeto bonus.',
    merge_pack_chance_percent: 'Porcentaje para ganar un sobre despues de fusionar.',
    merge_pack_min_level: 'Nivel minimo del objeto resultante para intentar ganar sobre.',
};

const progressLabels: Record<string, string> = {
    merge_count: 'Fusiones',
    collected_cards: 'Cartas coleccionadas',
    hearts: 'Corazones acumulados',
};

const triggerLabels: Record<string, string> = {
    premium: 'Compra premium',
    daily: 'Recompensa diaria',
    level: 'Subida de nivel',
    merge: 'Fusion especial',
};

const assetImages = import.meta.glob('../../assets/**/*.png', {
    eager: true,
    import: 'default',
    query: '?url',
}) as Record<string, string>;

const getAssetImage = (file?: string | null) => {
    if (!file) return '';
    if (file.startsWith('http') || file.startsWith('/')) return file;
    return assetImages[`../../assets/${file}`] ?? '';
};

const previewStyle = (item: MergeItemRow): CSSProperties => ({
    background: item.background_style || undefined,
    borderRadius: item.border_radius || undefined,
    '--mm-piece-image-size': `${item.image_size || 86}%`,
    '--mm-piece-image-x': `${item.image_offset_x || 0}%`,
    '--mm-piece-image-y': `${item.image_offset_y || 0}%`,
} as CSSProperties);

function Section({ kicker, title, note, children }: { kicker: string; title: string; note: string; children: ReactNode }) {
    return (
        <section className="mm-admin__panel">
            <div className="mm-admin__panel-head">
                <div>
                    <p className="mm-kicker">{kicker}</p>
                    <h2>{title}</h2>
                    <span className="mm-admin__hint">{note}</span>
                </div>
            </div>
            {children}
        </section>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <label className="mm-admin__field">
            <span>{label}</span>
            {children}
            {hint && <small>{hint}</small>}
        </label>
    );
}

export default function AdminBalance({ ready, settings, rules, rarities, missions, mergeItems, packs, playerLevels, progressKeys, triggerKeys }: BalanceProps) {
    const [activeMenu, setActiveMenu] = useState<BalanceMenu>('settings');
    const [activeMergeItemId, setActiveMergeItemId] = useState<number | null>(mergeItems[0]?.id ?? null);
    const form = useForm<BalanceFormData>({
        settings: settings.map((setting) => ({ ...setting, value: numberValue(setting.value) })),
        rules: rules.map((rule) => ({ ...rule, value: numberValue(rule.value) })),
        rarities,
        missions,
        mergeItems: mergeItems.map((item) => ({
            ...item,
            image_path: item.image_path ?? '',
            background_style: item.background_style ?? '',
        })),
        packs,
        playerLevels,
    });

    const setRow = (group: keyof BalanceFormData, index: number, key: string, value: string | number | boolean | null) => {
        form.setData(group, (form.data[group] as Array<Record<string, unknown>>).map((row, rowIndex) => (
            rowIndex === index ? { ...row, [key]: value } : row
        )) as never);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/balance');
    };

    const menus: Array<{ id: BalanceMenu; label: string; count: number }> = [
        { id: 'settings', label: 'Configuracion', count: form.data.settings.length },
        { id: 'rules', label: 'Reglas', count: form.data.rules.length },
        { id: 'rarities', label: 'Rarezas', count: form.data.rarities.length },
        { id: 'missions', label: 'Misiones', count: form.data.missions.length },
        { id: 'mergeItems', label: 'Objetos', count: form.data.mergeItems.length },
        { id: 'packs', label: 'Sobres', count: form.data.packs.length },
        { id: 'playerLevels', label: 'Niveles', count: form.data.playerLevels.length },
    ];
    const activeMergeIndex = Math.max(0, form.data.mergeItems.findIndex((item) => item.id === activeMergeItemId));
    const activeMergeItem = form.data.mergeItems[activeMergeIndex] ?? form.data.mergeItems[0];

    return (
        <>
            <Head title="Balance" />
            <main className="mm-admin">
                <section className="mm-admin__shell" aria-label="Balance">
                    <header className="mm-admin__header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark"><ShieldCheck size={18} aria-hidden /></div>
                            <div>
                                <p className="mm-kicker">Admin</p>
                                <h1>Balance</h1>
                            </div>
                        </div>
                        <div className="mm-admin__actions">
                            <button onClick={() => router.visit('/admin/cards')} type="button">Cartas</button>
                            <button onClick={() => router.visit('/admin')} type="button">Panel</button>
                            <button onClick={() => router.reload()} type="button"><RefreshCcw size={15} aria-hidden /></button>
                        </div>
                    </header>

                    {!ready && (
                        <section className="mm-admin__notice" role="status">
                            <strong>Balance pendiente</strong>
                            <span>Faltan tablas nuevas. Ejecuta migraciones cuando toque desplegar el VPS.</span>
                        </section>
                    )}

                    <form className={`mm-admin__balance ${activeMenu === 'mergeItems' ? 'has-live-preview' : ''}`} onSubmit={submit}>
                        <nav className="mm-admin__menu" aria-label="Secciones de balance">
                            {menus.map((menu) => (
                                <button
                                    aria-pressed={activeMenu === menu.id}
                                    className={activeMenu === menu.id ? 'is-active' : ''}
                                    key={menu.id}
                                    onClick={() => setActiveMenu(menu.id)}
                                    type="button"
                                >
                                    <span>{menu.label}</span>
                                    <strong>{menu.count}</strong>
                                </button>
                            ))}
                        </nav>

                        {activeMenu === 'settings' && <Section kicker="General" title="Configuracion" note="Valores base de energia y recompensa diaria.">
                            <div className="mm-admin__edit-grid">
                                {form.data.settings.map((setting, index) => (
                                    <article className="mm-admin__edit-card" key={setting.key}>
                                        <Field label={labels[setting.key] ?? setting.key} hint={help[setting.key]}>
                                            <input min={0} onChange={(event) => setRow('settings', index, 'value', numberValue(event.target.value))} type="number" value={setting.value} />
                                        </Field>
                                    </article>
                                ))}
                            </div>
                        </Section>}

                        {activeMenu === 'rules' && <Section kicker="Reglas" title="Generacion" note="Controla lo que sale de la caja magica y los sobres por fusion.">
                            <div className="mm-admin__edit-grid">
                                {form.data.rules.map((rule, index) => (
                                    <article className="mm-admin__edit-card" key={rule.key}>
                                        <Field label={labels[rule.key] ?? rule.key} hint={help[rule.key]}>
                                            <input min={0} onChange={(event) => setRow('rules', index, 'value', numberValue(event.target.value))} type="number" value={rule.value} />
                                        </Field>
                                    </article>
                                ))}
                            </div>
                        </Section>}

                        {activeMenu === 'rarities' && <Section kicker="Cartas" title="Rarezas" note="Define nombres, orden y recompensa por cartas duplicadas.">
                            <div className="mm-admin__edit-grid">
                                {form.data.rarities.map((rarity, index) => (
                                    <article className="mm-admin__edit-card" key={rarity.id}>
                                        <div className="mm-admin__card-head"><strong>{rarity.code}</strong><span>{rarity.is_active ? 'Activa' : 'Inactiva'}</span></div>
                                        <Field label="Nombre"><input onChange={(event) => setRow('rarities', index, 'name', event.target.value)} value={rarity.name} /></Field>
                                        <div className="mm-admin__field-row">
                                            <Field label="Duplicado"><input min={0} onChange={(event) => setRow('rarities', index, 'duplicate_hearts', numberValue(event.target.value))} type="number" value={rarity.duplicate_hearts} /></Field>
                                            <Field label="Orden"><input min={0} onChange={(event) => setRow('rarities', index, 'sort_order', numberValue(event.target.value))} type="number" value={rarity.sort_order} /></Field>
                                        </div>
                                        <Field label="Activa"><input checked={rarity.is_active} onChange={(event) => setRow('rarities', index, 'is_active', event.target.checked)} type="checkbox" /></Field>
                                    </article>
                                ))}
                            </div>
                        </Section>}

                        {activeMenu === 'missions' && <Section kicker="Objetivos" title="Misiones" note="Metas que el jugador puede reclamar por progreso.">
                            <div className="mm-admin__edit-grid">
                                {form.data.missions.map((mission, index) => (
                                    <article className="mm-admin__edit-card" key={mission.id}>
                                        <div className="mm-admin__card-head"><strong>{mission.external_id}</strong><span>{mission.is_active ? 'Activa' : 'Inactiva'}</span></div>
                                        <Field label="Texto"><input onChange={(event) => setRow('missions', index, 'label', event.target.value)} value={mission.label} /></Field>
                                        <Field label="Progreso que mide">
                                            <select onChange={(event) => setRow('missions', index, 'progress_key', event.target.value)} value={mission.progress_key}>
                                                {progressKeys.map((key) => <option key={key} value={key}>{progressLabels[key] ?? key}</option>)}
                                            </select>
                                        </Field>
                                        <div className="mm-admin__field-row">
                                            <Field label="Meta"><input min={1} onChange={(event) => setRow('missions', index, 'goal', numberValue(event.target.value))} type="number" value={mission.goal} /></Field>
                                            <Field label="Orden"><input min={0} onChange={(event) => setRow('missions', index, 'sort_order', numberValue(event.target.value))} type="number" value={mission.sort_order} /></Field>
                                        </div>
                                        <div className="mm-admin__field-row">
                                            <Field label="Corazones"><input min={0} onChange={(event) => setRow('missions', index, 'reward_hearts', numberValue(event.target.value))} type="number" value={mission.reward_hearts} /></Field>
                                            <Field label="Energia"><input min={0} onChange={(event) => setRow('missions', index, 'reward_energy', numberValue(event.target.value))} type="number" value={mission.reward_energy} /></Field>
                                        </div>
                                        <Field label="Activa"><input checked={mission.is_active} onChange={(event) => setRow('missions', index, 'is_active', event.target.checked)} type="checkbox" /></Field>
                                    </article>
                                ))}
                            </div>
                        </Section>}

                        {activeMenu === 'mergeItems' && <Section kicker="Tablero" title="Objetos fusionables" note="Ajusta recompensa, imagen, encuadre y estilo visual de cada ficha.">
                            {activeMergeItem && (
                                <>
                                    <aside className="mm-admin__live-preview" aria-label="Vista previa del objeto activo">
                                        <span className="mm-admin__piece-preview mm-admin__piece-preview--live">
                                            <span className={`mm-piece mm-piece--${activeMergeItem.symbol} ${activeMergeItem.image_path ? 'has-image' : ''}`} style={previewStyle(activeMergeItem)}>
                                                <span className="mm-piece__shine" />
                                                {activeMergeItem.image_path && <img alt={activeMergeItem.name} className="mm-piece__image" src={getAssetImage(activeMergeItem.image_path)} />}
                                                <span className="mm-piece__name">{activeMergeItem.name}</span>
                                            </span>
                                        </span>
                                        <div>
                                            <strong>{activeMergeItem.name}</strong>
                                            <span>Nivel {activeMergeItem.level} - {activeMergeItem.symbol}</span>
                                        </div>
                                    </aside>

                                    <div className="mm-admin__merge-picker" aria-label="Objetos fusionables">
                                        {form.data.mergeItems.map((item) => (
                                            <button
                                                aria-pressed={activeMergeItem.id === item.id}
                                                className={activeMergeItem.id === item.id ? 'is-active' : ''}
                                                key={item.id}
                                                onClick={() => setActiveMergeItemId(item.id)}
                                                type="button"
                                            >
                                                <span className="mm-admin__piece-preview">
                                                    <span className={`mm-piece mm-piece--${item.symbol} ${item.image_path ? 'has-image' : ''}`} style={previewStyle(item)}>
                                                        <span className="mm-piece__shine" />
                                                        {item.image_path && <img alt={item.name} className="mm-piece__image" src={getAssetImage(item.image_path)} />}
                                                        <span className="mm-piece__name">{item.name}</span>
                                                    </span>
                                                </span>
                                                <strong>N{item.level}</strong>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                            {activeMergeItem && (
                                <div className="mm-admin__edit-grid mm-admin__edit-grid--wide">
                                    <article className="mm-admin__edit-card" key={activeMergeItem.id}>
                                        <div className="mm-admin__merge-top">
                                            <div>
                                                <strong>Nivel {activeMergeItem.level}</strong>
                                                <span>{activeMergeItem.symbol}</span>
                                            </div>
                                        </div>
                                        <div className="mm-admin__group-title">Identidad</div>
                                        <Field label="Nombre"><input onChange={(event) => setRow('mergeItems', activeMergeIndex, 'name', event.target.value)} value={activeMergeItem.name} /></Field>
                                        <Field label="Imagen" hint="Asset interno, /storage/... o URL completa."><input onChange={(event) => setRow('mergeItems', activeMergeIndex, 'image_path', event.target.value)} value={activeMergeItem.image_path ?? ''} /></Field>
                                        <Field label="Fondo"><input onChange={(event) => setRow('mergeItems', activeMergeIndex, 'background_style', event.target.value)} value={activeMergeItem.background_style ?? ''} /></Field>
                                        <div className="mm-admin__group-title">Encuadre</div>
                                        <div className="mm-admin__field-row">
                                            <Field label="Radio"><input onChange={(event) => setRow('mergeItems', activeMergeIndex, 'border_radius', event.target.value)} value={activeMergeItem.border_radius} /></Field>
                                            <Field label="Tamano"><input min={20} max={160} onChange={(event) => setRow('mergeItems', activeMergeIndex, 'image_size', numberValue(event.target.value))} type="number" value={activeMergeItem.image_size} /></Field>
                                        </div>
                                        <div className="mm-admin__field-row">
                                            <Field label="Offset X"><input min={-100} max={100} onChange={(event) => setRow('mergeItems', activeMergeIndex, 'image_offset_x', numberValue(event.target.value))} type="number" value={activeMergeItem.image_offset_x} /></Field>
                                            <Field label="Offset Y"><input min={-100} max={100} onChange={(event) => setRow('mergeItems', activeMergeIndex, 'image_offset_y', numberValue(event.target.value))} type="number" value={activeMergeItem.image_offset_y} /></Field>
                                        </div>
                                        <div className="mm-admin__group-title">Beneficios</div>
                                        <div className="mm-admin__field-row">
                                            <Field label="XP"><input min={0} onChange={(event) => setRow('mergeItems', activeMergeIndex, 'xp', numberValue(event.target.value))} type="number" value={activeMergeItem.xp} /></Field>
                                            <Field label="Corazones"><input min={0} onChange={(event) => setRow('mergeItems', activeMergeIndex, 'hearts', numberValue(event.target.value))} type="number" value={activeMergeItem.hearts} /></Field>
                                        </div>
                                        <Field label="Activo"><input checked={activeMergeItem.is_active} onChange={(event) => setRow('mergeItems', activeMergeIndex, 'is_active', event.target.checked)} type="checkbox" /></Field>
                                    </article>
                                </div>
                            )}
                        </Section>}

                        {activeMenu === 'packs' && <Section kicker="Sobres" title="Packs" note="Define cuando aparece cada sobre, costo y cantidad de cartas.">
                            <div className="mm-admin__edit-grid">
                                {form.data.packs.map((pack, index) => (
                                    <article className="mm-admin__edit-card" key={pack.id}>
                                        <div className="mm-admin__card-head"><strong>{pack.external_id}</strong><span>{pack.is_active ? 'Activo' : 'Inactivo'}</span></div>
                                        <Field label="Nombre"><input onChange={(event) => setRow('packs', index, 'label', event.target.value)} value={pack.label} /></Field>
                                        <Field label="Disparo">
                                            <select onChange={(event) => setRow('packs', index, 'trigger_key', event.target.value)} value={pack.trigger_key}>
                                                {triggerKeys.map((key) => <option key={key} value={key}>{triggerLabels[key] ?? key}</option>)}
                                            </select>
                                        </Field>
                                        <div className="mm-admin__field-row">
                                            <Field label="Costo"><input min={0} onChange={(event) => setRow('packs', index, 'cost_hearts', numberValue(event.target.value))} type="number" value={pack.cost_hearts} /></Field>
                                            <Field label="Cartas"><input min={1} max={10} onChange={(event) => setRow('packs', index, 'cards_count', numberValue(event.target.value))} type="number" value={pack.cards_count} /></Field>
                                        </div>
                                        <div className="mm-admin__field-row">
                                            <Field label="Orden"><input min={0} onChange={(event) => setRow('packs', index, 'sort_order', numberValue(event.target.value))} type="number" value={pack.sort_order} /></Field>
                                            <Field label="Activo"><input checked={pack.is_active} onChange={(event) => setRow('packs', index, 'is_active', event.target.checked)} type="checkbox" /></Field>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </Section>}

                        {activeMenu === 'playerLevels' && <Section kicker="Niveles" title="Curva de jugador" note="XP necesaria, energia y sobre entregado al subir cada nivel.">
                            <div className="mm-admin__edit-grid">
                                {form.data.playerLevels.map((level, index) => (
                                    <article className="mm-admin__edit-card" key={level.id}>
                                        <div className="mm-admin__card-head"><strong>Nivel {level.level}</strong><span>{level.is_active ? 'Activo' : 'Inactivo'}</span></div>
                                        <div className="mm-admin__field-row">
                                            <Field label="XP requerida"><input min={1} onChange={(event) => setRow('playerLevels', index, 'xp_required', numberValue(event.target.value))} type="number" value={level.xp_required} /></Field>
                                            <Field label="Energia"><input min={0} onChange={(event) => setRow('playerLevels', index, 'reward_energy', numberValue(event.target.value))} type="number" value={level.reward_energy} /></Field>
                                        </div>
                                        <Field label="Sobre de premio">
                                            <select onChange={(event) => setRow('playerLevels', index, 'reward_pack_trigger', event.target.value || null)} value={level.reward_pack_trigger ?? ''}>
                                                <option value="">Sin sobre</option>
                                                {triggerKeys.map((key) => <option key={key} value={key}>{triggerLabels[key] ?? key}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Activo"><input checked={level.is_active} onChange={(event) => setRow('playerLevels', index, 'is_active', event.target.checked)} type="checkbox" /></Field>
                                    </article>
                                ))}
                            </div>
                        </Section>}

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
