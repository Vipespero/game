import { Head } from '@inertiajs/react';

type ProfileSettingsProps = {
    status?: string;
};

export default function ProfileSettings({ status }: ProfileSettingsProps) {
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
                </section>
            </main>
        </>
    );
}
