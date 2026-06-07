<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_levels', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('level')->unique();
            $table->unsignedInteger('xp_required');
            $table->unsignedInteger('reward_energy')->default(20);
            $table->string('reward_pack_trigger', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('game_rules', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('value');
            $table->timestamps();
        });

        $this->seedDefaults();
    }

    public function down(): void
    {
        Schema::dropIfExists('game_rules');
        Schema::dropIfExists('player_levels');
    }

    private function seedDefaults(): void
    {
        $now = now();
        $levels = [];

        for ($level = 1; $level <= 100; $level++) {
            $levels[] = [
                'level' => $level,
                'xp_required' => (int) round(60 + ($level - 1) * 110 + pow($level - 1, 2) * 35),
                'reward_energy' => 20,
                'reward_pack_trigger' => 'level',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('player_levels')->insert($levels);

        DB::table('game_rules')->insert([
            ['key' => 'magic_box_primary_level', 'value' => '1', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'magic_box_bonus_level', 'value' => '2', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'magic_box_bonus_chance_percent', 'value' => '18', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'merge_pack_min_level', 'value' => '5', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'merge_pack_chance_percent', 'value' => '8', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
};
