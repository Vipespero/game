<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const COLLAGE_FILENAME = 'collage-10-zapatos.png';

    public function up(): void
    {
        if (Schema::hasTable('collage_photos')) {
            DB::table('collage_photos')
                ->where('id', 10)
                ->where('filename', self::COLLAGE_FILENAME)
                ->delete();
        }

        File::delete(storage_path('app/public/collage/'.self::COLLAGE_FILENAME));

        if (Schema::hasTable('merge_items')) {
            DB::table('merge_items')
                ->where('level', 10)
                ->update([
                    'name' => 'Zapatos',
                    'image_path' => 'zapatos.png',
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('merge_items')) {
            DB::table('merge_items')
                ->where('level', 10)
                ->update([
                    'name' => 'Legendario',
                    'image_path' => null,
                    'updated_at' => now(),
                ]);
        }
    }
};
