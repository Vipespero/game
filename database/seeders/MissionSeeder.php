<?php

namespace Database\Seeders;

use App\Models\Mission;
use Illuminate\Database\Seeder;

class MissionSeeder extends Seeder
{
    public function run(): void
    {
        $missions = [
            ['merge-20', 'Fusiona 20 objetos', 'merge_count', 20, 80, 10, 10],
            ['album-5', 'Colecciona 5 cartas', 'collected_cards', 5, 120, 15, 20],
            ['hearts-500', 'Guarda 500 corazones', 'hearts', 500, 160, 0, 30],
        ];

        foreach ($missions as [$id, $label, $progressKey, $goal, $rewardHearts, $rewardEnergy, $sortOrder]) {
            Mission::query()->updateOrCreate(
                ['external_id' => $id],
                [
                    'label' => $label,
                    'progress_key' => $progressKey,
                    'goal' => $goal,
                    'reward_hearts' => $rewardHearts,
                    'reward_energy' => $rewardEnergy,
                    'sort_order' => $sortOrder,
                    'is_active' => true,
                ],
            );
        }
    }
}
