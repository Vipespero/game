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
            1 => ['linear-gradient(145deg, #ff9696, #e73b3b)', '50%', 86, 0, 8],
            2 => ['linear-gradient(145deg, #ffe79d, #ffba54)', '50%', 88, 0, 0],
            3 => ['linear-gradient(145deg, #ffd8ee, #ff74b8)', '50%', 76, 0, 6],
            4 => ['linear-gradient(145deg, #d8f4ff, #76cbff)', '50%', 92, 0, 4],
            5 => ['linear-gradient(145deg, #ff76bf, #cf4cf0)', '18px', 86, 0, 0],
            6 => ['linear-gradient(145deg, #ffd971, #f3a522)', '18px', 86, 0, 0],
            7 => ['linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', '18px', 86, 0, 0],
            8 => ['linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', '18px', 86, 0, 0],
            9 => ['linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', '18px', 86, 0, 0],
            10 => ['linear-gradient(145deg, #8be5ff, #9d77ff 55%, #ff86c9)', '18px', 86, 0, 0],
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
