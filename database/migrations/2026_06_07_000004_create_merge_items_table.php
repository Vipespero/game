<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merge_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('level')->unique();
            $table->string('name');
            $table->string('symbol', 32);
            $table->string('image_path')->nullable();
            $table->unsignedInteger('xp');
            $table->unsignedInteger('hearts');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $this->seedDefaults();
    }

    public function down(): void
    {
        Schema::dropIfExists('merge_items');
    }

    private function seedDefaults(): void
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

        DB::table('merge_items')->insert(array_map(fn (array $item): array => [
            'level' => $item[0],
            'name' => $item[1],
            'symbol' => $item[2],
            'image_path' => $item[3],
            'xp' => $item[4],
            'hearts' => $item[5],
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ], $items));
    }
};
