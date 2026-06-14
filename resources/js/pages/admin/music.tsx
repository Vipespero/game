import { Head, router } from '@inertiajs/react';
import { Music, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

type Track = {
    filename: string;
    url: string;
    size: number;
};

type MusicPageProps = {
    tracks: Track[];
};

export default function AdminMusic({ tracks }: MusicPageProps) {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!file) {
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('track', file);

        router.post('/admin/music', formData, {
            onFinish: () => {
                setUploading(false);
                setFile(null);
            },
        });
    };

    const remove = (filename: string) => {
        if (window.confirm(`Eliminar ${filename}?`)) {
            router.delete('/admin/music', {
                data: { filename },
            });
        }
    };

    return (
        <>
            <Head title="Musica" />
            <main className="mm-admin">
                <section className="mm-admin__shell" aria-label="Musica">
                    <header className="mm-admin__header">
                        <div className="mm-brand">
                            <div className="mm-brand__mark">
                                <ShieldCheck size={18} aria-hidden />
                            </div>
                            <div>
                                <p className="mm-kicker">Admin</p>
                                <h1>Musica</h1>
                            </div>
                        </div>
                        <div className="mm-admin__actions">
                            <button onClick={() => router.visit('/admin')} type="button">
                                Panel
                            </button>
                            <button onClick={() => router.visit('/admin/balance')} type="button">
                                Balance
                            </button>
                            <button onClick={() => router.visit('/admin/collage')} type="button">
                                Collage
                            </button>
                        </div>
                    </header>

                    <section className="mm-admin__panel">
                        <div className="mm-admin__panel-head">
                            <div>
                                <p className="mm-kicker">Subir</p>
                                <h2>Agregar cancion</h2>
                                <span className="mm-admin__hint">
                                    Formatos: MP3, OGG, WAV, M4A. Maximo 10MB. Se reproduce en loop infinito con salto aleatorio.
                                </span>
                            </div>
                        </div>

                        <form className="mm-admin__form" onSubmit={submit}>
                            <label>
                                <span>Archivo de audio</span>
                                <input
                                    accept=".mp3,.ogg,.wav,.m4a,audio/*"
                                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                    type="file"
                                />
                            </label>
                            {file && (
                                <p className="mm-admin__hint">
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                </p>
                            )}
                            <button
                                className="mm-auth__submit"
                                disabled={!file || uploading}
                                type="submit"
                            >
                                <Upload size={16} aria-hidden />
                                <span>{uploading ? 'Subiendo...' : 'Subir cancion'}</span>
                            </button>
                        </form>
                    </section>

                    <section className="mm-admin__panel">
                        <div className="mm-admin__panel-head">
                            <div>
                                <p className="mm-kicker">Biblioteca</p>
                                <h2>{tracks.length} canciones</h2>
                                <span className="mm-admin__hint">
                                    Las canciones se reproducen en orden aleatorio. El juego escoge una al azar al iniciar y salta a otra diferente cuando termina.
                                </span>
                            </div>
                        </div>

                        {tracks.length === 0 ? (
                            <div className="mm-admin__notice">
                                <Music size={18} aria-hidden />
                                <div>
                                    <strong>Sin canciones</strong>
                                    <span>Sube tu primera cancion para que suene de fondo en el juego.</span>
                                </div>
                            </div>
                        ) : (
                            <div className="mm-admin__list">
                                {tracks.map((track, index) => (
                                    <article className="mm-admin__edit-card" key={track.filename}>
                                        <div className="mm-admin__card-head">
                                            <div>
                                                <strong>{track.filename}</strong>
                                                <span>{track.size} MB</span>
                                            </div>
                                            <button
                                                className="mm-admin__delete-btn"
                                                onClick={() => remove(track.filename)}
                                                type="button"
                                            >
                                                <Trash2 size={14} aria-hidden />
                                                Eliminar
                                            </button>
                                        </div>
                                        <audio controls preload="none" src={track.url} />
                                        <p className="mm-admin__hint">
                                            Pista {index + 1} — se reproduce cuando el juego la escoge al azar.
                                        </p>
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
