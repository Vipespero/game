import { Head } from '@inertiajs/react';

type SecuritySettingsProps = {
    canManageTwoFactor: boolean;
    twoFactorEnabled?: boolean;
};

export default function SecuritySettings({ canManageTwoFactor, twoFactorEnabled }: SecuritySettingsProps) {
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
                </section>
            </main>
        </>
    );
}
