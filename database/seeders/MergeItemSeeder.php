<?php

namespace Database\Seeders;

use App\Models\MergeItem;
use Illuminate\Database\Seeder;

class MergeItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [1, 'Semilla', 'seed', 'Melody1.png', 'linear-gradient(145deg, #ff9696, #e73b3b)', '50%', 86, 0, 8, 6, 1],
            [2, 'Flor', 'flower', 'pompompurin.png', 'linear-gradient(145deg, #ffe79d, #ffba54)', '50%', 88, 0, 0, 10, 2],
            [3, 'Ramo', 'bouquet', 'Mymelodyrosa.png', 'linear-gradient(145deg, #ffd8ee, #ff74b8)', '50%', 76, 0, 6, 16, 4],
            [4, 'Peluche', 'plush', 'cinamoom.png', 'linear-gradient(145deg, #d8f4ff, #76cbff)', '50%', 92, 0, 4, 26, 7],
            [5, 'Lazo', 'bow', null, 'linear-gradient(145deg, #ff76bf, #cf4cf0)', '18px', 86, 0, 0, 42, 11],
            [6, 'Corona', 'crown', null, 'linear-gradient(145deg, #ffd971, #f3a522)', '18px', 86, 0, 0, 68, 18],
            [7, 'Tesoro', 'gem', null, 'linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', '18px', 86, 0, 0, 108, 28],
            [8, 'Castillo', 'castle', null, 'linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', '18px', 86, 0, 0, 166, 42],
            [9, 'Palacio', 'palace', null, 'linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', '18px', 86, 0, 0, 248, 62],
            [10, 'Legendario', 'rainbow', null, 'linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', '18px', 86, 0, 0, 360, 90],
        ];

        foreach ($items as [$level, $name, $symbol, $imagePath, $background, $radius, $imageSize, $offsetX, $offsetY, $xp, $hearts]) {
            MergeItem::query()->updateOrCreate(
                ['level' => $level],
                [
                    'name' => $name,
                    'symbol' => $symbol,
                    'image_path' => $imagePath,
                    'background_style' => $background,
                    'border_radius' => $radius,
                    'image_size' => $imageSize,
                    'image_offset_x' => $offsetX,
                    'image_offset_y' => $offsetY,
                    'xp' => $xp,
                    'hearts' => $hearts,
                    'is_active' => true,
                ],
            );
        }
    }
}
