import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Heart, LoaderCircle, LockKeyhole, Sparkles, UserPlus } from 'lucide-react';

type AuthMode = 'login' | 'register';

type LoginProps = {
    cardCount?: number;
    mode?: AuthMode;
    canRegister?: boolean;
    status?: string;
};

export default function LoginPage({ cardCount = 0, mode = 'login', canRegister = true, status }: LoginProps) {
    const [authMode, setAuthMode] = useState<AuthMode>(mode);
    const isRegister = authMode === 'register';

    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        remember: true,
    });

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

                    <p className="mm-auth__count">{cardCount} cartas activas listas para el album.</p>
                </section>
            </main>
        </>
    );
}
