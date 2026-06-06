import { Head, router } from '@inertiajs/react';

type VerifyEmailProps = {
    status?: string;
};

export default function VerifyEmail({ status }: VerifyEmailProps) {
    return (
        <>
            <Head title="Verificar email" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>MM</span>
                        <div>
                            <p className="mm-kicker">Cuenta</p>
                            <h1>Verificar email</h1>
                        </div>
                    </div>
                    {status && <p className="mm-auth__status">{status}</p>}
                    <button className="mm-auth__submit" onClick={() => router.post('/email/verification-notification')} type="button">
                        Reenviar correo
                    </button>
                </section>
            </main>
        </>
    );
}
