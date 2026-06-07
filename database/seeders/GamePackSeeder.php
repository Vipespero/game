<?php

namespace Database\Seeders;

use App\Models\GamePack;
use Illuminate\Database\Seeder;

class GamePackSeeder extends Seeder
{
    public function run(): void
    {
        $packs = [
            ['premium', 'Sobre premium', 'premium', 180, 3, 10],
            ['daily', 'Sobre diario', 'daily', 0, 3, 20],
            ['level', 'Sobre de nivel', 'level', 0, 3, 30],
            ['merge', 'Sobre por fusion', 'merge', 0, 3, 40],
        ];

        foreach ($packs as [$id, $label, $trigger, $cost, $cardsCount, $sortOrder]) {
            GamePack::query()->updateOrCreate(
                ['external_id' => $id],
                [
                    'label' => $label,
                    'trigger_key' => $trigger,
                    'cost_hearts' => $cost,
                    'cards_count' => $cardsCount,
                    'sort_order' => $sortOrder,
                    'is_active' => true,
                ],
            );
        }
    }
}
