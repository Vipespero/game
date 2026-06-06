import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

type ForgotPasswordProps = {
    status?: string;
};

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const form = useForm({ email: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/forgot-password');
    };

    return (
        <>
            <Head title="Recuperar clave" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>MM</span>
                        <div>
                            <p className="mm-kicker">Cuenta</p>
                            <h1>Recuperar clave</h1>
                        </div>
                    </div>
                    {status && <p className="mm-auth__status">{status}</p>}
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
                        <button className="mm-auth__submit" disabled={form.processing} type="submit">
                            Enviar enlace
                        </button>
                    </form>
                </section>
            </main>
        </>
    );
}
