<?php

namespace Database\Seeders;

use App\Models\Card;
use Illuminate\Database\Seeder;

class CardSeeder extends Seeder
{
    public function run(): void
    {
        $cards = [
            [1, 'Hello Kitty sonriente', 'Hello Kitty Clasica', 'SSR', 'SSR/01_hello_kitty_sonriente_ssr.png', 30],
            [2, 'Hello Kitty con mono rosa', 'Hello Kitty Especial', 'UR', 'UR/02_hello_kitty_mono_rosa_ur.png', 8],
            [3, 'Little Twin Stars con regalo', 'Signos del Zodiaco - Geminis', 'R', 'R/03_little_twin_stars_regalo_r.png', 110],
            [4, 'Little Twin Stars oveja', 'Signos del Zodiaco - Geminis', 'SSR', 'SSR/04_little_twin_stars_oveja_ssr.png', 30],
            [5, 'Pochacco en pijama', 'Mascotas y Amigos', 'SSR', 'SSR/05_pochacco_peluche_ssr.png', 30],
            [6, 'Little Twin Stars luna', 'Dulces Suenos', 'SR', 'SR/06_little_twin_stars_luna_sr.png', 70],
            [7, 'Hello Kitty leyendo', 'Hello Kitty Clasica', 'R', 'R/07_hello_kitty_leyendo_r.png', 110],
            [8, 'Hello Kitty en automovil', 'Hello Kitty Aventurera', 'SSR', 'SSR/08_hello_kitty_automovil_ssr.png', 30],
            [9, 'Pompompurin flor', 'Pompompurin Jardín', 'SSR', 'SSR/11_pompompurin_flor_ssr.png', 30],
            [10, 'Pompompurin carro', 'Pompompurin Aventurero', 'SSR', 'SSR/12_pompompurin_carro_ssr.png', 30],
            [11, 'Pompompurin en caja', 'Dulces Suenos', 'SR', 'SR/13_pompompurin_caja_sr.png', 70],
            [12, 'Kuromi flor', 'Kuromi Especial', 'SSR', 'SSR/14_kuromi_flor_ssr.png', 30],
            [13, 'Pompompurin helado', 'Pompompurin Dulce', 'UR', 'UR/15_pompompurin_helado_ur.png', 8],
            [14, 'Pompompurin trofeo', 'Pompompurin Campeon', 'UR', 'UR/16_pompompurin_trofeo_ur.png', 8],
        ];

        foreach ($cards as [$id, $name, $collection, $rarity, $imagePath, $weight]) {
            Card::query()->updateOrCreate(
                ['external_id' => "card-{$id}"],
                [
                    'name' => $name,
                    'collection' => $collection,
                    'rarity' => $rarity,
                    'image_path' => $imagePath,
                    'drop_weight' => $weight,
                    'is_active' => true,
                ],
            );
        }
    }
}
