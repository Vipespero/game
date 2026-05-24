<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Character;
use App\Models\TattooDesign;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        Character::create([
            'name'        => 'My Melody',
            'description' => 'Sanrio Original',
            'glb_path'    => 'models/my_melody.glb',
            'emoji'       => '🎀',
            'tags'        => 'sanrio kawaii',
            'sort_order'  => 1,
        ]);

        TattooDesign::create([
            'name'       => 'Dragón Tribal',
            'image_path' => 'designs/dragon.png',
            'category'   => 'tribal',
            'sort_order' => 1,
        ]);
    }
}
