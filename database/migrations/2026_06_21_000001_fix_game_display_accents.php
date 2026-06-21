<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('merge_items')) {
            DB::table('merge_items')
                ->where('level', 17)
                ->where('name', 'Jardin')
                ->update(['name' => 'Jardín']);
        }

        if (Schema::hasTable('game_packs')) {
            DB::table('game_packs')
                ->where('trigger_key', 'merge')
                ->where('label', 'Sobre por fusion')
                ->update(['label' => 'Sobre por fusión']);
        }

        if (Schema::hasTable('cards')) {
            DB::table('cards')
                ->where('collection', 'Pompompurin Jardin')
                ->update(['collection' => 'Pompompurin Jardín']);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('merge_items')) {
            DB::table('merge_items')
                ->where('level', 17)
                ->where('name', 'Jardín')
                ->update(['name' => 'Jardin']);
        }

        if (Schema::hasTable('game_packs')) {
            DB::table('game_packs')
                ->where('trigger_key', 'merge')
                ->where('label', 'Sobre por fusión')
                ->update(['label' => 'Sobre por fusion']);
        }

        if (Schema::hasTable('cards')) {
            DB::table('cards')
                ->where('collection', 'Pompompurin Jardín')
                ->update(['collection' => 'Pompompurin Jardin']);
        }
    }
};
