import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Heart, LoaderCircle, LockKeyhole, Sparkles, UserPlus } from 'lucide-react';
import cardManifest from '../../assets/cards/cards.json';
import packImageUrl from '../../assets/sanrio_pack.png?url';

type AuthMode = 'login' | 'register';

type LoginProps = {
    mode?: AuthMode;
    canRegister?: boolean;
    status?: string;
};

const cardImages = import.meta.glob('../../assets/cards/**/*.png', {
    eager: true,
    import: 'default',
    query: '?url',
}) as Record<string, string>;

export default function LoginPage({ mode = 'login', canRegister = true, status }: LoginProps) {
    const [authMode, setAuthMode] = useState<AuthMode>(mode);
    const [loadedAssets, setLoadedAssets] = useState(0);

    const assetUrls = useMemo(() => [packImageUrl, ...Object.values(cardImages)], []);
    const loadPercent = Math.round((loadedAssets / Math.max(assetUrls.length, 1)) * 100);
    const isRegister = authMode === 'register';

    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        remember: true,
    });

    useEffect(() => {
        let cancelled = false;

        assetUrls.forEach((url) => {
            const image = new Image();
            let settled = false;
            const markLoaded = () => {
                if (settled) return;
                settled = true;

                if (!cancelled) {
                    setLoadedAssets((value) => Math.min(value + 1, assetUrls.length));
                }
            };

            image.decoding = 'async';
            image.onload = markLoaded;
            image.onerror = markLoaded;
            image.src = url;

            if ('decode' in image) {
                image.decode().then(markLoaded).catch(markLoaded);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [assetUrls]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (isRegister) {
            form.post('/register');
            return;
        }

        form.post('/login');
    };

    return (
        <>
            <Head title="Entrar" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>
                            <Sparkles size={24} aria-hidden />
                        </span>
                        <div>
                            <p className="mm-kicker">Juego privado</p>
                            <h1>Melody Merge</h1>
                        </div>
                    </div>

                    <div className="mm-auth__preview">
                        <img alt="Sobre Sanrio" src={packImageUrl} />
                        <div>
                            <strong>{loadPercent}%</strong>
                            <span>Cargando cartas y sobre</span>
                        </div>
                        <div className="mm-auth__progress">
                            <span style={{ width: `${loadPercent}%` }} />
                        </div>
                    </div>

                    <form className="mm-auth__form" onSubmit={submit}>
                        <div className="mm-auth__heading">
                            {isRegister ? <UserPlus size={18} aria-hidden /> : <LockKeyhole size={18} aria-hidden />}
                            <h2>{isRegister ? 'Crear partida' : 'Entrar a tu partida'}</h2>
                        </div>

                        {status && <p className="mm-auth__status">{status}</p>}

                        {isRegister && (
                            <label>
                                <span>Nombre</span>
                                <input
                                    autoComplete="name"
                                    name="name"
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    required
                                    type="text"
                                    value={form.data.name}
                                />
                                {form.errors.name && <small>{form.errors.name}</small>}
                            </label>
                        )}

                        <label>
                            <span>Email</span>
                            <input
                                autoComplete="email"
                                name="email"
                                onChange={(event) => form.setData('email', event.target.value)}
                                required
                                type="email"
                                value={form.data.email}
                            />
                            {form.errors.email && <small>{form.errors.email}</small>}
                        </label>

                        <label>
                            <span>Clave</span>
                            <input
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                                name="password"
                                onChange={(event) => form.setData('password', event.target.value)}
                                required
                                type="password"
                                value={form.data.password}
                            />
                            {form.errors.password && <small>{form.errors.password}</small>}
                        </label>

                        {isRegister && (
                            <label>
                                <span>Repetir clave</span>
                                <input
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                    required
                                    type="password"
                                    value={form.data.password_confirmation}
                                />
                            </label>
                        )}

                        <button className="mm-auth__submit" disabled={form.processing} type="submit">
                            {form.processing ? <LoaderCircle size={18} aria-hidden /> : <Heart size={18} aria-hidden />}
                            <span>{isRegister ? 'Crear y jugar' : 'Entrar'}</span>
                        </button>
                    </form>

                    {canRegister && (
                        <button
                            className="mm-auth__switch"
                            onClick={() => {
                                form.clearErrors();
                                setAuthMode(isRegister ? 'login' : 'register');
                            }}
                            type="button"
                        >
                            {isRegister ? 'Ya tengo una partida' : 'Crear cuenta nueva'}
                        </button>
                    )}

                    <p className="mm-auth__count">{(cardManifest as Array<unknown>).length} cartas oficiales listas para el album.</p>
                </section>
            </main>
        </>
    );
}
