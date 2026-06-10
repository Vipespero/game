<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class MusicController extends Controller
{
    private const MUSIC_PATH = 'public/music';
    private const MAX_FILE_SIZE = 10240;
    private const ALLOWED_EXTENSIONS = ['mp3', 'ogg', 'wav', 'm4a'];

    public function index(): Response
    {
        return Inertia::render('admin/music', [
            'tracks' => $this->listTracks(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'track' => ['required', 'file', 'max:'.self::MAX_FILE_SIZE],
        ]);

        $file = $request->file('track');
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, self::ALLOWED_EXTENSIONS)) {
            return back()->withErrors(['track' => 'Formato no permitido. Usa MP3, OGG, WAV o M4A.']);
        }

        $existingTracks = $this->getTrackFiles();
        $nextNumber = count($existingTracks) + 1;
        $filename = 'track-'.str_pad($nextNumber, 2, '0', STR_PAD_LEFT).'.'.$extension;

        $file->storeAs(self::MUSIC_PATH, 'public');

        $file->move(
            storage_path('app/public/music'),
            $filename,
        );

        return back()->with('toast', ['type' => 'success', 'message' => "Cancion subida: {$filename}"]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'filename' => ['required', 'string'],
        ]);

        $filename = basename($request->input('filename'));
        $path = storage_path('app/public/music/'.$filename);

        if (File::exists($path)) {
            File::delete($path);
        }

        return back()->with('toast', ['type' => 'success', 'message' => "Cancion eliminada: {$filename}"]);
    }

    private function listTracks(): array
    {
        $files = $this->getTrackFiles();

        return array_map(function (string $file): array {
            $path = storage_path('app/public/music/'.$file);

            return [
                'filename' => $file,
                'url' => '/storage/music/'.$file,
                'size' => File::exists($path) ? round(filesize($path) / 1024 / 1024, 1) : 0,
            ];
        }, $files);
    }

    private function getTrackFiles(): array
    {
        $directory = storage_path('app/public/music');

        if (! File::isDirectory($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $files = File::glob($directory.'/*.{mp3,ogg,wav,m4a}', GLOB_BRACE);

        return array_map(fn (string $path): string => basename($path), $files);
    }
}
