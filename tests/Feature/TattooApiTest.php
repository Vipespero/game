<?php

namespace Tests\Feature;

use App\Models\Character;
use App\Models\TattooDesign;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TattooApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_character_index_only_returns_active_characters(): void
    {
        Character::create([
            'name' => 'Active Character',
            'glb_path' => 'models/active.glb',
            'is_active' => true,
        ]);

        Character::create([
            'name' => 'Inactive Character',
            'glb_path' => 'models/inactive.glb',
            'is_active' => false,
        ]);

        $this->getJson('/api/v1/characters')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Active Character');
    }

    public function test_inactive_character_cannot_be_shown(): void
    {
        $character = Character::create([
            'name' => 'Inactive Character',
            'glb_path' => 'models/inactive.glb',
            'is_active' => false,
        ]);

        $this->getJson("/api/v1/characters/{$character->id}")
            ->assertNotFound();
    }

    public function test_design_index_only_returns_active_designs(): void
    {
        TattooDesign::create([
            'name' => 'Active Design',
            'image_path' => 'designs/active.png',
            'is_active' => true,
        ]);

        TattooDesign::create([
            'name' => 'Inactive Design',
            'image_path' => 'designs/inactive.png',
            'is_active' => false,
        ]);

        $this->getJson('/api/v1/designs')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Active Design');
    }

    public function test_inactive_design_cannot_be_shown(): void
    {
        $design = TattooDesign::create([
            'name' => 'Inactive Design',
            'image_path' => 'designs/inactive.png',
            'is_active' => false,
        ]);

        $this->getJson("/api/v1/designs/{$design->id}")
            ->assertNotFound();
    }
}
