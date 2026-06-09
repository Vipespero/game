<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merge_items', function (Blueprint $table) {
            $table->string('background_style')->nullable()->after('image_path');
            $table->string('border_radius', 32)->default('18px')->after('background_style');
            $table->unsignedTinyInteger('image_size')->default(86)->after('border_radius');
            $table->smallInteger('image_offset_x')->default(0)->after('image_size');
            $table->smallInteger('image_offset_y')->default(0)->after('image_offset_x');
        });

        $this->seedVisuals();
    }

    public function down(): void
    {
        Schema::table('merge_items', function (Blueprint $table) {
            $table->dropColumn([
                'background_style',
                'border_radius',
                'image_size',
                'image_offset_x',
                'image_offset_y',
            ]);
        });
    }

    private function seedVisuals(): void
    {
        $visuals = [
            1 => ['linear-gradient(145deg, #fff4c7, #ffbd59 52%, #ff8a3d)', '50%', 106, 0, 4],
            2 => ['linear-gradient(145deg, #ffe79d, #ffba54)', '50%', 88, 0, 0],
            3 => ['linear-gradient(145deg, #c9ff9c, #ff8ab3 50%, #e32266)', '50%', 110, 0, 3],
            4 => ['linear-gradient(145deg, #d8f4ff, #76cbff)', '50%', 92, 0, 4],
            5 => ['linear-gradient(145deg, #f7c4ff, #b56cff 52%, #7c4dff)', '50%', 104, 0, 2],
            6 => ['linear-gradient(145deg, #ff9696, #e73b3b)', '50%', 86, 0, 8],
            7 => ['linear-gradient(145deg, #ffc1dc, #9d4edd 55%, #35235f)', '50%', 118, 0, 5],
            8 => ['linear-gradient(145deg, #ffd8ee, #ff74b8)', '50%', 76, 0, 6],
            9 => ['linear-gradient(145deg, #d9b4ff, #8b5cf6 52%, #4c1d95)', '50%', 116, 0, 2],
            10 => ['linear-gradient(145deg, #ffe66d, #ff78bd 52%, #8b5cf6)', '50%', 100, 0, 0],
            11 => ['linear-gradient(145deg, #fff1a8, #ff7ab6 55%, #9d77ff)', '50%', 100, 0, 0],
            12 => ['linear-gradient(145deg, #b8f4ff, #7c83ff 52%, #ff92d0)', '50%', 100, 0, 0],
            13 => ['linear-gradient(145deg, #fef3ff, #a5d8ff 52%, #f0abfc)', '50%', 100, 0, 0],
            14 => ['linear-gradient(145deg, #fff0a6, #ffbd59 52%, #ff7ab6)', '50%', 100, 0, 0],
            15 => ['linear-gradient(145deg, #ffd6e8, #ff8cc6 52%, #b794f4)', '50%', 100, 0, 0],
            16 => ['linear-gradient(145deg, #9ff3ff, #77a7ff 52%, #d68cff)', '50%', 100, 0, 0],
            17 => ['linear-gradient(145deg, #c7ffd8, #72d6a4 52%, #ff99cf)', '50%', 100, 0, 0],
            18 => ['linear-gradient(145deg, #d7c6ff, #8b5cf6 52%, #ff8cc6)', '50%', 100, 0, 0],
            19 => ['linear-gradient(145deg, #ffe7a8, #ff87c2 48%, #7dd3fc)', '50%', 100, 0, 0],
            20 => ['linear-gradient(145deg, #fff1a8, #ff78bd 42%, #8b5cf6 72%, #65d7ff)', '50%', 100, 0, 0],
        ];

        foreach ($visuals as $level => [$background, $radius, $size, $offsetX, $offsetY]) {
            DB::table('merge_items')
                ->where('level', $level)
                ->update([
                    'background_style' => $background,
                    'border_radius' => $radius,
                    'image_size' => $size,
                    'image_offset_x' => $offsetX,
                    'image_offset_y' => $offsetY,
                    'updated_at' => now(),
                ]);
        }
    }
};
