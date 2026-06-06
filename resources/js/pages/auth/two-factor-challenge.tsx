import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function TwoFactorChallenge() {
    const form = useForm({ code: '', recovery_code: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/two-factor-challenge');
    };

    return (
        <>
            <Head title="Doble factor" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>MM</span>
                        <div>
                            <p className="mm-kicker">Seguridad</p>
                            <h1>Doble factor</h1>
                        </div>
                    </div>
                    <form className="mm-auth__form" onSubmit={submit}>
                        <label>
                            <span>Codigo</span>
                            <input
                                autoComplete="one-time-code"
                                onChange={(event) => form.setData('code', event.target.value)}
                                type="text"
                                value={form.data.code}
                            />
                            {form.errors.code && <small>{form.errors.code}</small>}
                        </label>
                        <label>
                            <span>Codigo de recuperacion</span>
                            <input
                                onChange={(event) => form.setData('recovery_code', event.target.value)}
                                type="text"
                                value={form.data.recovery_code}
                            />
                            {form.errors.recovery_code && <small>{form.errors.recovery_code}</small>}
                        </label>
                        <button className="mm-auth__submit" disabled={form.processing} type="submit">
                            Entrar
                        </button>
                    </form>
                </section>
            </main>
        </>
    );
}
