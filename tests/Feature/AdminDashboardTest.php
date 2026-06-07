<?php

namespace Tests\Feature;

use App\Models\GameSave;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
    }

    public function test_regular_user_cannot_open_admin_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('admin.dashboard'))
            ->assertForbidden();
    }

    public function test_admin_can_open_dashboard(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $player = User::factory()->create();

        GameSave::query()->create([
            'user_id' => $player->id,
            'hearts' => 240,
            'energy' => 80,
            'player_level' => 2,
            'merge_count' => 4,
            'active_tab' => 'album',
        ]);

        $save = $player->gameSave()->firstOrFail();
        $pack = $save->packs()->create([
            'pack_uid' => 'pack-one',
            'label' => 'Sobre',
            'position' => 0,
        ]);
        $pack->cards()->createMany([
            ['card_id' => 'card-1', 'position' => 0],
            ['card_id' => 'card-2', 'position' => 1],
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->where('stats.users', 2)
                ->where('stats.admins', 1)
                ->where('stats.saves', 1)
                ->has('players', 2),
            );
    }
}
