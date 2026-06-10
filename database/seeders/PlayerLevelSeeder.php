<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlayerLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [];

        for ($level = 1; $level <= 100; $level++) {
            $levels[] = [
                'level' => $level,
                'xp_required' => (int) round(60 + ($level - 1) * 110 + pow($level - 1, 2) * 35),
                'reward_energy' => 20,
                'reward_pack_trigger' => 'level',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('player_levels')->upsert($levels, ['level'], ['xp_required', 'reward_energy', 'reward_pack_trigger', 'is_active', 'updated_at']);
    }
}
