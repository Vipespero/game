<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_packs', function (Blueprint $table) {
            $table->id();
            $table->string('external_id', 40)->unique();
            $table->string('label', 80);
            $table->string('trigger_key', 30);
            $table->unsignedInteger('cost_hearts')->default(0);
            $table->unsignedTinyInteger('cards_count')->default(3);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();

        DB::table('game_packs')->insert([
            ['external_id' => 'premium', 'label' => 'Sobre premium', 'trigger_key' => 'premium', 'cost_hearts' => 180, 'cards_count' => 3, 'sort_order' => 10, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['external_id' => 'daily', 'label' => 'Sobre diario', 'trigger_key' => 'daily', 'cost_hearts' => 0, 'cards_count' => 3, 'sort_order' => 20, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['external_id' => 'level', 'label' => 'Sobre de nivel', 'trigger_key' => 'level', 'cost_hearts' => 0, 'cards_count' => 3, 'sort_order' => 30, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['external_id' => 'merge', 'label' => 'Sobre por fusion', 'trigger_key' => 'merge', 'cost_hearts' => 0, 'cards_count' => 3, 'sort_order' => 40, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('game_packs');
    }
};
