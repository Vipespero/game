<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CollagePhoto;
use App\Models\GameSaveCollagePiece;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CollageController extends Controller
{
    private const MAX_FILE_SIZE = 12288;
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    private const PIECES_COUNT = 16;

    public function index(): Response
    {
        return Inertia::render('admin/collage', [
            'photos' => CollagePhoto::query()
                ->latest()
                ->get()
                ->map(fn (CollagePhoto $photo): array => $this->serialize($photo))
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'image', 'max:'.self::MAX_FILE_SIZE],
            'label' => ['nullable', 'string', 'max:80'],
        ]);

        $file = $request->file('photo');
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            return back()->withErrors(['photo' => 'Formato no permitido. Usa JPG, PNG o WEBP.']);
        }

        $directory = storage_path('app/public/collage');

        if (! File::isDirectory($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $filename = 'collage-'.now()->format('Ymd-His').'-'.Str::random(6).'.'.$extension;
        $file->move($directory, $filename);

        CollagePhoto::query()->create([
            'filename' => $filename,
            'label' => $request->input('label') ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'pieces_count' => self::PIECES_COUNT,
        ]);

        return back()->with('toast', ['type' => 'success', 'message' => 'Foto agregada al collage.']);
    }

    public function destroy(CollagePhoto $collage): RedirectResponse
    {
        $usedPieces = GameSaveCollagePiece::query()
            ->where('piece_id', 'like', $collage->id.':%')
            ->count();

        if ($usedPieces > 0) {
            return back()->withErrors([
                'photo' => "No se puede eliminar: esta foto ya tiene {$usedPieces} pieza(s) desbloqueadas.",
            ]);
        }

        $path = storage_path('app/public/collage/'.$collage->filename);

        if (File::exists($path)) {
            File::delete($path);
        }

        $collage->delete();

        return back()->with('toast', ['type' => 'success', 'message' => 'Foto eliminada del collage.']);
    }

    private function serialize(CollagePhoto $photo): array
    {
        $usedPieces = GameSaveCollagePiece::query()
            ->where('piece_id', 'like', $photo->id.':%')
            ->count();

        return [
            'id' => $photo->id,
            'filename' => $photo->filename,
            'label' => $photo->label,
            'url' => '/storage/collage/'.$photo->filename,
            'piecesCount' => $photo->pieces_count,
            'usedPieces' => $usedPieces,
            'canDelete' => $usedPieces === 0,
        ];
    }
}
