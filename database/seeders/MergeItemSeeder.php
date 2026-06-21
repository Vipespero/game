<?php

namespace Database\Seeders;

use App\Models\MergeItem;
use Illuminate\Database\Seeder;

class MergeItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [1, 'Corona', 'crown', 'pochaco.png', 'linear-gradient(145deg, #fff4c7, #ffbd59 52%, #ff8a3d)', '50%', 106, 0, 4, 6, 1],
            [2, 'Flor', 'flower', 'pompompurin.png', 'linear-gradient(145deg, #ffe79d, #ffba54)', '50%', 88, 0, 0, 10, 2],
            [3, 'Castillo', 'castle', 'Fresa.png', 'linear-gradient(145deg, #c9ff9c, #ff8ab3 50%, #e32266)', '50%', 110, 0, 3, 16, 4],
            [4, 'Peluche', 'plush', 'cinamoom.png', 'linear-gradient(145deg, #d8f4ff, #76cbff)', '50%', 92, 0, 4, 26, 7],
            [5, 'Lazo', 'bow', 'bibble.png', 'linear-gradient(145deg, #f7c4ff, #b56cff 52%, #7c4dff)', '50%', 104, 0, 2, 42, 11],
            [6, 'Semilla', 'seed', 'Melody1.png', 'linear-gradient(145deg, #ff9696, #e73b3b)', '50%', 86, 0, 8, 68, 18],
            [7, 'Tesoro', 'gem', 'maria.png', 'linear-gradient(145deg, #ffc1dc, #9d4edd 55%, #35235f)', '50%', 118, 0, 5, 108, 28],
            [8, 'Ramo', 'bouquet', 'Mymelodyrosa.png', 'linear-gradient(145deg, #ffd8ee, #ff74b8)', '50%', 76, 0, 6, 166, 42],
            [9, 'Palacio', 'palace', 'Gengar.png', 'linear-gradient(145deg, #d9b4ff, #8b5cf6 52%, #4c1d95)', '50%', 116, 0, 2, 248, 62],
            [10, 'Zapatos', 'rainbow', 'zapatos.png', 'linear-gradient(145deg, #ffe66d, #ff78bd 52%, #8b5cf6)', '50%', 100, 0, 0, 360, 90],
            [11, 'Talismán', 'star', 'talisman.png', 'linear-gradient(145deg, #fff1a8, #ff7ab6 55%, #9d77ff)', '50%', 100, 0, 0, 510, 128],
            [12, 'Cometa', 'comet', null, 'linear-gradient(145deg, #b8f4ff, #7c83ff 52%, #ff92d0)', '50%', 100, 0, 0, 706, 178],
            [13, 'Nube', 'cloud', null, 'linear-gradient(145deg, #fef3ff, #a5d8ff 52%, #f0abfc)', '50%', 100, 0, 0, 958, 240],
            [14, 'Campana', 'bell', null, 'linear-gradient(145deg, #fff0a6, #ffbd59 52%, #ff7ab6)', '50%', 100, 0, 0, 1278, 320],
            [15, 'Cupcake', 'cupcake', null, 'linear-gradient(145deg, #ffd6e8, #ff8cc6 52%, #b794f4)', '50%', 100, 0, 0, 1680, 420],
            [16, 'Diamante', 'diamond', null, 'linear-gradient(145deg, #9ff3ff, #77a7ff 52%, #d68cff)', '50%', 100, 0, 0, 2182, 546],
            [17, 'Jardín', 'garden', null, 'linear-gradient(145deg, #c7ffd8, #72d6a4 52%, #ff99cf)', '50%', 100, 0, 0, 2804, 702],
            [18, 'Sueño', 'dream', null, 'linear-gradient(145deg, #d7c6ff, #8b5cf6 52%, #ff8cc6)', '50%', 100, 0, 0, 3570, 892],
            [19, 'Reino', 'kingdom', null, 'linear-gradient(145deg, #ffe7a8, #ff87c2 48%, #7dd3fc)', '50%', 100, 0, 0, 4508, 1128],
            [20, 'Final', 'final', null, 'linear-gradient(145deg, #fff1a8, #ff78bd 42%, #8b5cf6 72%, #65d7ff)', '50%', 100, 0, 0, 5650, 1412],
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
