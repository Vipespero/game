import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

type VerifyEmailProps = {
    status?: string;
};

export default function VerifyEmail({ status }: VerifyEmailProps) {
    const [processing, setProcessing] = useState(false);

    const resend = () => {
        setProcessing(true);
        router.post('/email/verification-notification', {}, {
            onFinish: () => setProcessing(false),
        });
    };

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
                    <button className="mm-auth__submit" disabled={processing} onClick={resend} type="button">
                        {processing ? <LoaderCircle size={18} aria-hidden /> : null}
                        <span>Reenviar correo</span>
                    </button>
                </section>
            </main>
        </>
    );
}
