<?php

namespace Database\Seeders;

use App\Models\MergeItem;
use Illuminate\Database\Seeder;

class MergeItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [1, 'Semilla', 'seed', 'Melody1.png', 6, 1],
            [2, 'Flor', 'flower', 'pompompurin.png', 10, 2],
            [3, 'Ramo', 'bouquet', 'Mymelodyrosa.png', 16, 4],
            [4, 'Peluche', 'plush', 'cinamoom.png', 26, 7],
            [5, 'Lazo', 'bow', null, 42, 11],
            [6, 'Corona', 'crown', null, 68, 18],
            [7, 'Tesoro', 'gem', null, 108, 28],
            [8, 'Castillo', 'castle', null, 166, 42],
            [9, 'Palacio', 'palace', null, 248, 62],
            [10, 'Legendario', 'rainbow', null, 360, 90],
        ];

        foreach ($items as [$level, $name, $symbol, $imagePath, $xp, $hearts]) {
            MergeItem::query()->updateOrCreate(
                ['level' => $level],
                [
                    'name' => $name,
                    'symbol' => $symbol,
                    'image_path' => $imagePath,
                    'xp' => $xp,
                    'hearts' => $hearts,
                    'is_active' => true,
                ],
            );
        }
    }
}
