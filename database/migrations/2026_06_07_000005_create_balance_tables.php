<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('card_rarities', function (Blueprint $table) {
            $table->id();
            $table->string('code', 16)->unique();
            $table->string('name');
            $table->unsignedInteger('duplicate_hearts');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->string('external_id', 40)->unique();
            $table->string('label');
            $table->string('progress_key', 40);
            $table->unsignedInteger('goal');
            $table->unsignedInteger('reward_hearts')->default(0);
            $table->unsignedInteger('reward_energy')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('game_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('value');
            $table->timestamps();
        });

        $this->seedDefaults();
    }

    public function down(): void
    {
        Schema::dropIfExists('game_settings');
        Schema::dropIfExists('missions');
        Schema::dropIfExists('card_rarities');
    }

    private function seedDefaults(): void
    {
        $now = now();

        DB::table('card_rarities')->insert([
            ['code' => 'C', 'name' => 'Comun', 'duplicate_hearts' => 8, 'sort_order' => 10, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'R', 'name' => 'Rara', 'duplicate_hearts' => 18, 'sort_order' => 20, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'SR', 'name' => 'Super rara', 'duplicate_hearts' => 34, 'sort_order' => 30, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'SSR', 'name' => 'Especial', 'duplicate_hearts' => 62, 'sort_order' => 40, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'UR', 'name' => 'Ultra rara', 'duplicate_hearts' => 110, 'sort_order' => 50, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'SECRET', 'name' => 'Secreta', 'duplicate_hearts' => 180, 'sort_order' => 60, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('missions')->insert([
            ['external_id' => 'merge-20', 'label' => 'Fusiona 20 objetos', 'progress_key' => 'merge_count', 'goal' => 20, 'reward_hearts' => 80, 'reward_energy' => 10, 'sort_order' => 10, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['external_id' => 'album-5', 'label' => 'Colecciona 5 cartas', 'progress_key' => 'collected_cards', 'goal' => 5, 'reward_hearts' => 120, 'reward_energy' => 15, 'sort_order' => 20, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['external_id' => 'hearts-500', 'label' => 'Guarda 500 corazones', 'progress_key' => 'hearts', 'goal' => 500, 'reward_hearts' => 160, 'reward_energy' => 0, 'sort_order' => 30, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('game_settings')->insert([
            ['key' => 'max_energy', 'value' => '100', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'premium_pack_cost', 'value' => '180', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'daily_reward_energy', 'value' => '30', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'daily_reward_hearts', 'value' => '120', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'level_reward_energy', 'value' => '20', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
};
