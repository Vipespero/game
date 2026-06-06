import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function ConfirmPassword() {
    const form = useForm({ password: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/user/confirm-password');
    };

    return (
        <>
            <Head title="Confirmar clave" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>MM</span>
                        <div>
                            <p className="mm-kicker">Seguridad</p>
                            <h1>Confirmar clave</h1>
                        </div>
                    </div>
                    <form className="mm-auth__form" onSubmit={submit}>
                        <label>
                            <span>Clave</span>
                            <input
                                autoComplete="current-password"
                                onChange={(event) => form.setData('password', event.target.value)}
                                required
                                type="password"
                                value={form.data.password}
                            />
                            {form.errors.password && <small>{form.errors.password}</small>}
                        </label>
                        <button className="mm-auth__submit" disabled={form.processing} type="submit">
                            Confirmar
                        </button>
                    </form>
                </section>
            </main>
        </>
    );
}
