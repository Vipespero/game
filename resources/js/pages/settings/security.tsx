import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

type SecuritySettingsProps = {
    canManageTwoFactor: boolean;
    twoFactorEnabled?: boolean;
};

export default function SecuritySettings({ canManageTwoFactor, twoFactorEnabled }: SecuritySettingsProps) {
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put('/settings/password', {
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title="Seguridad" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>MM</span>
                        <div>
                            <p className="mm-kicker">Ajustes</p>
                            <h1>Seguridad</h1>
                        </div>
                    </div>
                    <p className="mm-auth__count">
                        {canManageTwoFactor
                            ? `Doble factor ${twoFactorEnabled ? 'activo' : 'inactivo'}`
                            : 'Doble factor no disponible'}
                    </p>
                    <form className="mm-auth__form" onSubmit={submit}>
                        <label>
                            <span>Clave actual</span>
                            <input
                                autoComplete="current-password"
                                onChange={(event) => form.setData('current_password', event.target.value)}
                                required
                                type="password"
                                value={form.data.current_password}
                            />
                            {form.errors.current_password && <small>{form.errors.current_password}</small>}
                        </label>
                        <label>
                            <span>Nueva clave</span>
                            <input
                                autoComplete="new-password"
                                onChange={(event) => form.setData('password', event.target.value)}
                                required
                                type="password"
                                value={form.data.password}
                            />
                            {form.errors.password && <small>{form.errors.password}</small>}
                        </label>
                        <label>
                            <span>Repetir nueva clave</span>
                            <input
                                autoComplete="new-password"
                                onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                required
                                type="password"
                                value={form.data.password_confirmation}
                            />
                        </label>
                        <button className="mm-auth__submit" disabled={form.processing} type="submit">
                            Actualizar clave
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
