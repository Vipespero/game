import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import { Image, ShieldCheck, Trash2, Upload } from 'lucide-react';

type CollagePhoto = {
    id: number;
    filename: string;
    label: string | null;
    url: string;
    piecesCount: number;
    usedPieces: number;
    canDelete: boolean;
};

type CollagePageProps = {
    photos: CollagePhoto[];
};

export default function AdminCollage({ photos }: CollagePageProps) {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [label, setLabel] = useState('');

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!file) {
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('label', label);

        router.post('/admin/collage', formData, {
            onFinish: () => {
                setUploading(false);
                setFile(null);
                setLabel('');
            },
        });
    };

    const remove = (photo: CollagePhoto) => {
        if (!photo.canDelete) {
            window.alert('Esta foto ya tiene piezas desbloqueadas y no se puede eliminar.');
            return;
        }

        if (window.confirm(`Eliminar ${photo.label || photo.filename}?`)) {
            router.delete(`/admin/collage/${photo.id}`);
        }
    };

    return (
        <>
            <Head title="Collage" />
            <main className="mm-admin">
                <section className="mm-admin__shell" aria-label="Collage">
                    <header className="mm-admin__header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark">
                                <ShieldCheck size={18} aria-hidden />
                            </div>
                            <div>
                                <p className="mm-kicker">Admin</p>
                                <h1>Collage</h1>
                            </div>
                        </div>
                        <div className="mm-admin__actions">
                            <button onClick={() => router.visit('/admin')} type="button">
                                Panel
                            </button>
                            <button onClick={() => router.visit('/admin/music')} type="button">
                                Musica
                            </button>
                            <button onClick={() => router.visit('/admin/balance')} type="button">
                                Balance
                            </button>
                        </div>
                    </header>

                    <section className="mm-admin__panel">
                        <div className="mm-admin__panel-head">
                            <div>
                                <p className="mm-kicker">Subir</p>
                                <h2>Agregar foto</h2>
                                <span className="mm-admin__hint">
                                    Cada foto agrega 16 piezas nuevas al recuerdo. Formatos: JPG, PNG, WEBP. Maximo 12MB.
                                </span>
                            </div>
                        </div>

                        <form className="mm-admin__form" onSubmit={submit}>
                            <label>
                                <span>Nombre opcional</span>
                                <input
                                    onChange={(event) => setLabel(event.target.value)}
                                    placeholder="Nuestro viaje"
                                    type="text"
                                    value={label}
                                />
                            </label>
                            <label>
                                <span>Foto</span>
                                <input
                                    accept=".jpg,.jpeg,.png,.webp,image/*"
                                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                    type="file"
                                />
                            </label>
                            {file && (
                                <p className="mm-admin__hint">
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                </p>
                            )}
                            <button className="mm-auth__submit" disabled={!file || uploading} type="submit">
                                <Upload size={16} aria-hidden />
                                <span>{uploading ? 'Subiendo...' : 'Subir foto'}</span>
                            </button>
                        </form>
                    </section>

                    <section className="mm-admin__panel">
                        <div className="mm-admin__panel-head">
                            <div>
                                <p className="mm-kicker">Fotos</p>
                                <h2>{photos.length} recuerdos</h2>
                                <span className="mm-admin__hint">
                                    Una foto no se puede eliminar si alguien ya desbloqueo al menos una pieza.
                                </span>
                            </div>
                        </div>

                        {photos.length === 0 ? (
                            <div className="mm-admin__notice">
                                <Image size={18} aria-hidden />
                                <div>
                                    <strong>Sin fotos</strong>
                                    <span>Sube una foto para que los sobres empiecen a revelar piezas del collage.</span>
                                </div>
                            </div>
                        ) : (
                            <div className="mm-admin__list">
                                {photos.map((photo) => (
                                    <article className="mm-admin__edit-card" key={photo.id}>
                                        <div className="mm-admin__card-head">
                                            <div>
                                                <strong>{photo.label || photo.filename}</strong>
                                                <span>{photo.usedPieces}/{photo.piecesCount} piezas usadas</span>
                                            </div>
                                            <button
                                                className="mm-admin__delete-btn"
                                                disabled={!photo.canDelete}
                                                onClick={() => remove(photo)}
                                                type="button"
                                            >
                                                <Trash2 size={14} aria-hidden />
                                                Eliminar
                                            </button>
                                        </div>
                                        <img alt={photo.label || photo.filename} className="mm-admin__photo-preview" src={photo.url} />
                                        {!photo.canDelete && (
                                            <p className="mm-admin__hint">
                                                Protegida: ya hay avance guardado con esta foto.
                                            </p>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </section>
            </main>
        </>
    );
}
