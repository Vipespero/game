<?php

namespace Database\Seeders;

use App\Models\GameSetting;
use Illuminate\Database\Seeder;

class GameSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'max_energy' => 100,
            'daily_reward_energy' => 30,
            'daily_reward_hearts' => 120,
        ];

        foreach ($settings as $key => $value) {
            GameSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value],
            );
        }
    }
}
