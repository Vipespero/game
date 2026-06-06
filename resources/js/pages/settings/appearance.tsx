import { Head, router } from '@inertiajs/react';

export default function AppearanceSettings() {
    const setAppearance = (appearance: 'light' | 'dark' | 'system') => {
        document.cookie = `appearance=${appearance}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.classList.toggle(
            'dark',
            appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
        );
    };

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
                    <div className="mm-auth__form">
                        <button className="mm-auth__submit" onClick={() => setAppearance('light')} type="button">
                            Claro
                        </button>
                        <button className="mm-auth__switch" onClick={() => setAppearance('dark')} type="button">
                            Oscuro
                        </button>
                        <button className="mm-auth__switch" onClick={() => setAppearance('system')} type="button">
                            Sistema
                        </button>
                    </div>
                    <button className="mm-auth__switch" onClick={() => router.visit('/')} type="button">
                        Volver al juego
                    </button>
                </section>
            </main>
        </>
    );
}
