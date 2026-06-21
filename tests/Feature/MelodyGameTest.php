<?php

namespace Tests\Feature;

use App\Models\Card;
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
                ->has('cards')
                ->where('gameSave', null),
            );
    }

    public function test_user_can_save_sanitized_game_state(): void
    {
        $user = User::factory()->create();
        $board = array_fill(0, 30, null);
        $board[0] = ['id' => 'seed-one', 'level' => 1];

        $this->actingAs($user)
            ->putJson(route('melody.save'), [
                'state' => [
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

        $state = $user->gameSave()
            ->with(['boardItems', 'packs.cards', 'claimedMissions'])
            ->firstOrFail()
            ->toGameState();

        $this->assertCount(30, $state['board']);
        $this->assertSame(80, $state['energy']);
        $this->assertSame('album', $state['activeTab']);
        $this->assertSame(['merge-20'], $state['claimedMissions']);
    }

    public function test_user_can_save_high_level_merge_items(): void
    {
        $user = User::factory()->create();
        $board = array_fill(0, 30, null);
        $board[0] = ['id' => 'final-item', 'level' => 20];

        $this->actingAs($user)
            ->putJson(route('melody.save'), [
                'state' => [
                    'board' => $board,
                    'energy' => 80,
                    'hearts' => 240,
                    'xp' => 12,
                    'playerLevel' => 2,
                    'mergeCount' => 4,
                    'openedPacks' => [],
                    'activeTab' => 'merge',
                    'claimedMissions' => [],
                    'dailyRewardClaimedAt' => null,
                    'lastSeenAt' => now()->toISOString(),
                ],
            ])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $state = $user->gameSave()
            ->with(['boardItems', 'packs.cards', 'claimedMissions'])
            ->firstOrFail()
            ->toGameState();

        $this->assertSame(20, $state['board'][0]['level']);
    }

    public function test_user_can_save_three_card_packs(): void
    {
        $user = User::factory()->create();
        $board = array_fill(0, 30, null);

        $this->actingAs($user)
            ->putJson(route('melody.save'), [
                'state' => [
                    'board' => $board,
                    'energy' => 80,
                    'hearts' => 240,
                    'xp' => 12,
                    'playerLevel' => 2,
                    'mergeCount' => 4,
                    'openedPacks' => [
                        [
                            'id' => 'pack-three',
                            'label' => 'Sobre normal',
                            'cards' => [
                                'card-1',
                                'card-2',
                                'card-3',
                            ],
                        ],
                    ],
                    'activeTab' => 'album',
                    'claimedMissions' => [],
                    'dailyRewardClaimedAt' => null,
                    'lastSeenAt' => now()->toISOString(),
                ],
            ])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $state = $user->gameSave()
            ->with(['boardItems', 'packs.cards', 'claimedMissions'])
            ->firstOrFail()
            ->toGameState();

        $this->assertCount(3, $state['openedPacks'][0]['cards']);
    }

    public function test_user_can_save_memory_as_active_tab(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson(route('melody.save'), [
                'state' => [
                    'board' => array_fill(0, 30, null),
                    'energy' => 80,
                    'hearts' => 240,
                    'xp' => 12,
                    'playerLevel' => 2,
                    'mergeCount' => 4,
                    'openedPacks' => [],
                    'activeTab' => 'memory',
                    'claimedMissions' => [],
                    'dailyRewardClaimedAt' => null,
                    'lastSeenAt' => now()->toISOString(),
                ],
            ])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $state = $user->gameSave()
            ->with(['boardItems', 'packs.cards', 'claimedMissions'])
            ->firstOrFail()
            ->toGameState();

        $this->assertSame('memory', $state['activeTab']);
    }

    public function test_user_can_save_blocks_progress(): void
    {
        $user = User::factory()->create();
        $blockBoard = array_fill(0, 64, 0);
        $blockBoard[0] = 2;

        $this->actingAs($user)
            ->putJson(route('melody.save'), [
                'state' => [
                    'board' => array_fill(0, 30, null),
                    'energy' => 80,
                    'hearts' => 240,
                    'xp' => 12,
                    'playerLevel' => 2,
                    'mergeCount' => 4,
                    'openedPacks' => [],
                    'activeTab' => 'blocks',
                    'claimedMissions' => [],
                    'collagePieces' => [],
                    'blockBoard' => $blockBoard,
                    'blockPieces' => [
                        ['id' => 'piece-one', 'shapeId' => 'square', 'color' => 3],
                    ],
                    'blockScore' => 120,
                    'blockBest' => 300,
                    'blockCombo' => 2,
                    'dailyRewardClaimedAt' => null,
                    'lastSeenAt' => now()->toISOString(),
                ],
            ])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $state = $user->gameSave()
            ->with(['boardItems', 'packs.cards', 'claimedMissions', 'collagePieces'])
            ->firstOrFail()
            ->toGameState();

        $this->assertSame('blocks', $state['activeTab']);
        $this->assertSame(2, $state['blockBoard'][0]);
        $this->assertSame(120, $state['blockScore']);
        $this->assertSame(300, $state['blockBest']);
        $this->assertSame(2, $state['blockCombo']);
        $this->assertSame('square', $state['blockPieces'][0]['shapeId']);
    }

    public function test_inactive_cards_are_hidden_from_game_catalog(): void
    {
        $user = User::factory()->create();

        Card::query()
            ->where('external_id', 'card-1')
            ->update(['is_active' => false]);

        $this->actingAs($user)
            ->get(route('melody'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('melody/index')
                ->where('cards.0.id', 'card-2')
                ->missing('cards.13'),
            );
    }
}
