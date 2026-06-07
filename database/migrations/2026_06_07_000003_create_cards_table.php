<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->string('external_id', 32)->unique();
            $table->string('name');
            $table->string('collection');
            $table->string('rarity', 16)->index();
            $table->string('image_path');
            $table->unsignedInteger('drop_weight')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $this->seedInitialCards();
    }

    public function down(): void
    {
        Schema::dropIfExists('cards');
    }

    private function seedInitialCards(): void
    {
        $now = now();
        $cards = [
            [1, 'Hello Kitty sonriente', 'Hello Kitty Clasica', 'SSR', 'SSR/01_hello_kitty_sonriente_ssr.png', 30],
            [2, 'Hello Kitty con mono rosa', 'Hello Kitty Especial', 'UR', 'UR/02_hello_kitty_mono_rosa_ur.png', 8],
            [3, 'Little Twin Stars con regalo', 'Signos del Zodiaco - Geminis', 'R', 'R/03_little_twin_stars_regalo_r.png', 110],
            [4, 'Little Twin Stars oveja', 'Signos del Zodiaco - Geminis', 'SSR', 'SSR/04_little_twin_stars_oveja_ssr.png', 30],
            [5, 'Pochacco en pijama', 'Mascotas y Amigos', 'SSR', 'SSR/05_pochacco_peluche_ssr.png', 30],
            [6, 'Little Twin Stars luna', 'Dulces Suenos', 'SR', 'SR/06_little_twin_stars_luna_sr.png', 70],
            [7, 'Hello Kitty leyendo', 'Hello Kitty Clasica', 'R', 'R/07_hello_kitty_leyendo_r.png', 110],
            [8, 'Hello Kitty en automovil', 'Hello Kitty Aventurera', 'SSR', 'SSR/08_hello_kitty_automovil_ssr.png', 30],
            [9, 'Pompompurin flor', 'Pompompurin Jardin', 'SSR', 'SSR/11_pompompurin_flor_ssr.png', 30],
            [10, 'Pompompurin carro', 'Pompompurin Aventurero', 'SSR', 'SSR/12_pompompurin_carro_ssr.png', 30],
            [11, 'Pompompurin en caja', 'Dulces Suenos', 'SR', 'SR/13_pompompurin_caja_sr.png', 70],
            [12, 'Kuromi flor', 'Kuromi Especial', 'SSR', 'SSR/14_kuromi_flor_ssr.png', 30],
            [13, 'Pompompurin helado', 'Pompompurin Dulce', 'UR', 'UR/15_pompompurin_helado_ur.png', 8],
            [14, 'Pompompurin trofeo', 'Pompompurin Campeon', 'UR', 'UR/16_pompompurin_trofeo_ur.png', 8],
        ];

        DB::table('cards')->insert(array_map(fn (array $card): array => [
            'external_id' => "card-{$card[0]}",
            'name' => $card[1],
            'collection' => $card[2],
            'rarity' => $card[3],
            'image_path' => $card[4],
            'drop_weight' => $card[5],
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $cards));
    }
};
