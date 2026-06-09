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
            [5, 'Lazo', 'bow', 'bibble.png', 'linear-gradient(145deg, #ff76bf, #cf4cf0)', '18px', 92, 0, 0, 42, 11],
            [6, 'Corona', 'crown', 'pochaco.png', 'linear-gradient(145deg, #ffd971, #f3a522)', '18px', 90, 0, 2, 68, 18],
            [7, 'Tesoro', 'gem', 'maria.png', 'linear-gradient(145deg, #1f1530, #9d4edd 52%, #ff86c9)', '22px', 132, 0, 10, 108, 28],
            [8, 'Castillo', 'castle', 'Fresa.png', 'linear-gradient(145deg, #b9ff8a, #ff6f9f 48%, #d81b60)', '50%', 108, 0, 2, 166, 42],
            [9, 'Palacio', 'palace', null, 'linear-gradient(145deg, #f8b7ff, #8b5cf6 55%, #65d7ff)', '18px', 86, 0, 0, 248, 62],
            [10, 'Legendario', 'rainbow', null, 'linear-gradient(145deg, #ffe66d, #ff78bd 52%, #8b5cf6)', '18px', 86, 0, 0, 360, 90],
            [11, 'Estrella', 'star', null, 'linear-gradient(145deg, #fff1a8, #ff7ab6 55%, #9d77ff)', '20px', 86, 0, 0, 510, 128],
            [12, 'Cometa', 'comet', null, 'linear-gradient(145deg, #b8f4ff, #7c83ff 52%, #ff92d0)', '20px', 86, 0, 0, 706, 178],
            [13, 'Nube', 'cloud', null, 'linear-gradient(145deg, #fef3ff, #a5d8ff 52%, #f0abfc)', '22px', 86, 0, 0, 958, 240],
            [14, 'Campana', 'bell', null, 'linear-gradient(145deg, #fff0a6, #ffbd59 52%, #ff7ab6)', '22px', 86, 0, 0, 1278, 320],
            [15, 'Cupcake', 'cupcake', null, 'linear-gradient(145deg, #ffd6e8, #ff8cc6 52%, #b794f4)', '24px', 86, 0, 0, 1680, 420],
            [16, 'Diamante', 'diamond', null, 'linear-gradient(145deg, #9ff3ff, #77a7ff 52%, #d68cff)', '24px', 86, 0, 0, 2182, 546],
            [17, 'Jardin', 'garden', null, 'linear-gradient(145deg, #c7ffd8, #72d6a4 52%, #ff99cf)', '26px', 86, 0, 0, 2804, 702],
            [18, 'Sueño', 'dream', null, 'linear-gradient(145deg, #d7c6ff, #8b5cf6 52%, #ff8cc6)', '26px', 86, 0, 0, 3570, 892],
            [19, 'Reino', 'kingdom', null, 'linear-gradient(145deg, #ffe7a8, #ff87c2 48%, #7dd3fc)', '28px', 86, 0, 0, 4508, 1128],
            [20, 'Final', 'final', null, 'linear-gradient(145deg, #fff1a8, #ff78bd 42%, #8b5cf6 72%, #65d7ff)', '28px', 86, 0, 0, 5650, 1412],
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
