<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MelodyGameTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('melody'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_open_game(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('melody'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('melody/index')
                ->where('gameSave', null),
            );
    }

    public function test_user_can_save_sanitized_game_state(): void
    {
        $user = User::factory()->create();
        $board = array_fill(0, 25, null);
        $board[0] = ['id' => 'seed-one', 'level' => 1];

        $this->actingAs($user)
            ->putJson(route('melody.save'), [
                'payload' => [
                    'board' => $board,
                    'energy' => 80,
                    'hearts' => 240,
                    'xp' => 12,
                    'playerLevel' => 2,
                    'mergeCount' => 4,
                    'openedPacks' => [
                        [
                            'id' => 'pack-one',
                            'label' => 'Sobre diario',
                            'cards' => ['card-1', 'card-2', 'card-3'],
                        ],
                    ],
                    'activeTab' => 'album',
                    'claimedMissions' => ['merge-20'],
                    'dailyRewardClaimedAt' => now()->toISOString(),
                    'lastSeenAt' => now()->toISOString(),
                ],
            ])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $payload = $user->gameSave()->firstOrFail()->payload;

        $this->assertCount(25, $payload['board']);
        $this->assertSame(80, $payload['energy']);
        $this->assertSame('album', $payload['activeTab']);
        $this->assertSame(['merge-20'], $payload['claimedMissions']);
    }
}
