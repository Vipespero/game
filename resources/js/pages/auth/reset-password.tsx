import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

type ResetPasswordProps = {
    email?: string;
    token: string;
};

export default function ResetPassword({ email = '', token }: ResetPasswordProps) {
    const form = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/reset-password');
    };

    return (
        <>
            <Head title="Nueva clave" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>MM</span>
                        <div>
                            <p className="mm-kicker">Cuenta</p>
                            <h1>Nueva clave</h1>
                        </div>
                    </div>
                    <form className="mm-auth__form" onSubmit={submit}>
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
                        <label>
                            <span>Clave</span>
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
                            <span>Repetir clave</span>
                            <input
                                autoComplete="new-password"
                                onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                required
                                type="password"
                                value={form.data.password_confirmation}
                            />
                        </label>
                        <button className="mm-auth__submit" disabled={form.processing} type="submit">
                            Guardar clave
                        </button>
                    </form>
                </section>
            </main>
        </>
    );
}
