import { Head } from '@inertiajs/react';

export default function AppearanceSettings() {
    return (
        <>
            <Head title="Apariencia" />
            <main className="mm-auth">
                <section className="mm-auth__panel">
                    <div className="mm-auth__brand">
                        <span>MM</span>
                        <div>
                            <p className="mm-kicker">Ajustes</p>
                            <h1>Apariencia</h1>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
