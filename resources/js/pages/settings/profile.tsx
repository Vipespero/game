import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

type ProfileSettingsProps = {
    status?: string;
    auth?: {
        user?: {
            name?: string;
            email?: string;
        } | null;
    };
};

export default function ProfileSettings({ auth, status }: ProfileSettingsProps) {
    const form = useForm({
        name: auth?.user?.name ?? '',
        email: auth?.user?.email ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch('/settings/profile');
    };

    return (
        <>
            <Head title="Perfil" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>MM</span>
                        <div>
                            <p className="mm-kicker">Ajustes</p>
                            <h1>Perfil</h1>
                        </div>
                    </div>
                    {status && <p className="mm-auth__status">{status}</p>}
                    <form className="mm-auth__form" onSubmit={submit}>
                        <label>
                            <span>Nombre</span>
                            <input
                                autoComplete="name"
                                onChange={(event) => form.setData('name', event.target.value)}
                                required
                                type="text"
                                value={form.data.name}
                            />
                            {form.errors.name && <small>{form.errors.name}</small>}
                        </label>
                        <label>
                            <span>Email</span>
                            <input
                                autoComplete="email"
                                onChange={(event) => form.setData('email', event.target.value)}
                                required
                                type="email"
                                value={form.data.email}
                            />
                            {form.errors.email && <small>{form.errors.email}</small>}
                        </label>
                        <button className="mm-auth__submit" disabled={form.processing} type="submit">
                            Guardar perfil
                        </button>
                    </form>
                    <button className="mm-auth__switch" onClick={() => router.visit('/')} type="button">
                        Volver al juego
                    </button>
                </section>
            </main>
        </>
    );
}
