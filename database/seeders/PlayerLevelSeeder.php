<?php

namespace Database\Seeders;

use App\Models\PlayerLevel;
use Illuminate\Database\Seeder;

class PlayerLevelSeeder extends Seeder
{
    public function run(): void
    {
        for ($level = 1; $level <= 100; $level++) {
            PlayerLevel::query()->updateOrCreate(
                ['level' => $level],
                [
                    'xp_required' => (int) round(60 + ($level - 1) * 110 + pow($level - 1, 2) * 35),
                    'reward_energy' => 20,
                    'reward_pack_trigger' => 'level',
                    'is_active' => true,
                ],
            );
        }
    }
}
