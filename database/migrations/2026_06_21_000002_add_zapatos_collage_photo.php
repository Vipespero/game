<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const PHOTO_ID = 10;
    private const FILENAME = 'collage-10-zapatos.png';

    public function up(): void
    {
        if (! Schema::hasTable('collage_photos')) {
            return;
        }

        $source = resource_path('js/assets/zapatos.png');
        $directory = storage_path('app/public/collage');

        if (! File::exists($source)) {
            throw new RuntimeException('No se encontró resources/js/assets/zapatos.png.');
        }

        File::ensureDirectoryExists($directory);
        File::copy($source, $directory.'/'.self::FILENAME);

        DB::table('collage_photos')->updateOrInsert(
            ['id' => self::PHOTO_ID],
            [
                'filename' => self::FILENAME,
                'label' => 'Zapatos',
                'pieces_count' => 16,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        if (Schema::hasTable('collage_photos')) {
            DB::table('collage_photos')
                ->where('id', self::PHOTO_ID)
                ->where('filename', self::FILENAME)
                ->delete();
        }

        File::delete(storage_path('app/public/collage/'.self::FILENAME));
    }
};
