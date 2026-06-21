<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('merge_items')) {
            return;
        }

        DB::table('merge_items')
            ->where('level', 12)
            ->update([
                'name' => 'Joker',
                'image_path' => 'joker.png',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('merge_items')) {
            return;
        }

        DB::table('merge_items')
            ->where('level', 12)
            ->update([
                'name' => 'Cometa',
                'image_path' => null,
                'updated_at' => now(),
            ]);
    }
};
