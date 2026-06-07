<?php

namespace Database\Seeders;

use App\Models\CardRarity;
use Illuminate\Database\Seeder;

class CardRaritySeeder extends Seeder
{
    public function run(): void
    {
        $rarities = [
            ['C', 'Comun', 8, 10],
            ['R', 'Rara', 18, 20],
            ['SR', 'Super rara', 34, 30],
            ['SSR', 'Especial', 62, 40],
            ['UR', 'Ultra rara', 110, 50],
            ['SECRET', 'Secreta', 180, 60],
        ];

        foreach ($rarities as [$code, $name, $duplicateHearts, $sortOrder]) {
            CardRarity::query()->updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'duplicate_hearts' => $duplicateHearts,
                    'sort_order' => $sortOrder,
                    'is_active' => true,
                ],
            );
        }
    }
}
