<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminCardsTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_user_cannot_manage_cards(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('admin.cards.index'))
            ->assertForbidden();
    }

    public function test_admin_can_list_cards(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->get(route('admin.cards.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/cards/index')
                ->has('cards'),
            );
    }

    public function test_admin_can_create_card(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->post(route('admin.cards.store'), [
                'external_id' => 'card-99',
                'name' => 'Carta nueva',
                'collection' => 'Especial',
                'rarity' => 'SR',
                'image_path' => 'SR/carta_nueva.png',
                'drop_weight' => 50,
                'is_active' => true,
            ])
            ->assertRedirect(route('admin.cards.index'));

        $this->assertDatabaseHas('cards', [
            'external_id' => 'card-99',
            'name' => 'Carta nueva',
        ]);
    }

    public function test_delete_deactivates_card(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $card = Card::query()->firstOrFail();

        $this->actingAs($admin)
            ->delete(route('admin.cards.destroy', $card))
            ->assertRedirect(route('admin.cards.index'));

        $this->assertFalse($card->refresh()->is_active);
    }
}
