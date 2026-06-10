<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\CardRarity;
use App\Models\GamePack;
use App\Models\GameRule;
use App\Models\GameSave;
use App\Models\GameSetting;
use App\Models\MergeItem;
use App\Models\Mission;
use App\Models\PlayerLevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MelodyController extends Controller
{
    private const BOARD_SIZE = 25;
    private const MAX_ENERGY = 100;
    private const FALLBACK_MAX_ITEM_LEVEL = 20;
    private const MAX_PACK_CARDS = 3;
    private const MAX_PACK_HISTORY = 120;
    private const VALID_TABS = ['merge', 'album', 'room', 'memory'];
    public function show(Request $request): Response
    {
        $gameSave = $request->user()
            ->gameSave()
            ->with(['boardItems', 'packs.cards', 'claimedMissions'])
            ->first();

        return Inertia::render('melody/index', [
            'cards' => $this->activeCards(),
            'cardRarities' => $this->activeCardRarities(),
            'gameConfig' => $this->gameConfig(),
            'gamePacks' => $this->activeGamePacks(),
            'gameRules' => $this->gameRules(),
            'mergeItems' => $this->activeMergeItems(),
            'missions' => $this->activeMissions(),
            'playerLevels' => $this->activePlayerLevels(),
            'gameSave' => $gameSave?->toGameState(),
        ]);
    }

    public function save(Request $request): JsonResponse
    {
        $gameConfig = $this->gameConfig();
        $maxItemLevel = $this->maxItemLevel();
        $cardRules = ['string'];

        if (Schema::hasTable('cards')) {
            $cardRules[] = Rule::exists('cards', 'external_id');
        }

        $validated = $request->validate([
            'state' => ['required', 'array'],
            'state.board' => ['sometimes', 'array', 'size:'.self::BOARD_SIZE],
            'state.board.*' => ['nullable', 'array'],
            'state.board.*.id' => ['nullable', 'string', 'max:64'],
            'state.board.*.level' => ['nullable', 'integer', 'min:1', 'max:'.$maxItemLevel],
            'state.energy' => ['sometimes', 'integer', 'min:0', 'max:'.$gameConfig['maxEnergy']],
            'state.hearts' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'state.xp' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'state.playerLevel' => ['sometimes', 'integer', 'min:1', 'max:999'],
            'state.mergeCount' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'state.openedPacks' => ['sometimes', 'array', 'max:'.self::MAX_PACK_HISTORY],
            'state.openedPacks.*' => ['array'],
            'state.openedPacks.*.id' => ['required_with:state.openedPacks', 'string', 'max:64'],
            'state.openedPacks.*.label' => ['required_with:state.openedPacks', 'string', 'max:80'],
            'state.openedPacks.*.cards' => ['required_with:state.openedPacks', 'array', 'min:1', 'max:'.self::MAX_PACK_CARDS],
            'state.openedPacks.*.cards.*' => $cardRules,
            'state.activeTab' => ['sometimes', Rule::in(self::VALID_TABS)],
            'state.claimedMissions' => ['sometimes', 'array', 'max:12'],
            'state.claimedMissions.*' => ['string', 'max:40'],
            'state.dailyRewardClaimedAt' => ['nullable', 'date'],
            'state.lastSeenAt' => ['nullable', 'date'],
        ]);

        $state = $this->sanitizeState($validated['state']);

        DB::transaction(function () use ($state, $request): void {
            $gameSave = $request->user()->gameSave()->updateOrCreate(
                ['user_id' => $request->user()->id],
                [
                    'energy' => $state['energy'],
                    'hearts' => $state['hearts'],
                    'xp' => $state['xp'],
                    'player_level' => $state['playerLevel'],
                    'merge_count' => $state['mergeCount'],
                    'active_tab' => $state['activeTab'],
                    'daily_reward_claimed_at' => $state['dailyRewardClaimedAt'],
                    'last_seen_at' => now(),
                ],
            );

            $this->syncBoard($gameSave, $state['board']);
            $this->syncPacks($gameSave, $state['openedPacks']);
            $this->syncClaimedMissions($gameSave, $state['claimedMissions']);
        });

        return response()->json([
            'saved' => true,
        ]);
    }

    /**
     * Keep client saves small and shaped like the game actually expects.
     */
    private function sanitizeState(array $state): array
    {
        $openedPacks = collect(Arr::get($state, 'openedPacks', []))
            ->take(self::MAX_PACK_HISTORY)
            ->map(fn (array $pack): array => [
                'id' => (string) $pack['id'],
                'label' => (string) $pack['label'],
                'cards' => array_values(array_slice($pack['cards'], 0, self::MAX_PACK_CARDS)),
            ])
            ->all();

        return [
            'board' => $this->sanitizeBoard(Arr::get($state, 'board', [])),
            'energy' => (int) Arr::get($state, 'energy', 0),
            'hearts' => (int) Arr::get($state, 'hearts', 0),
            'xp' => (int) Arr::get($state, 'xp', 0),
            'playerLevel' => (int) Arr::get($state, 'playerLevel', 1),
            'mergeCount' => (int) Arr::get($state, 'mergeCount', 0),
            'openedPacks' => $openedPacks,
            'activeTab' => Arr::get($state, 'activeTab', 'merge'),
            'claimedMissions' => array_values(array_unique(Arr::get($state, 'claimedMissions', []))),
            'dailyRewardClaimedAt' => Arr::get($state, 'dailyRewardClaimedAt'),
            'lastSeenAt' => now()->toISOString(),
        ];
    }

    private function sanitizeBoard(array $board): array
    {
        return collect($board)
            ->take(self::BOARD_SIZE)
            ->map(function (?array $cell): ?array {
                if (! $cell || ! isset($cell['level'])) {
                    return null;
                }

                return [
                    'id' => (string) ($cell['id'] ?? ''),
                    'level' => (int) $cell['level'],
                ];
            })
            ->pad(self::BOARD_SIZE, null)
            ->all();
    }

    private function syncBoard(GameSave $gameSave, array $board): void
    {
        $gameSave->boardItems()->delete();

        $items = collect($board)
            ->map(function (?array $cell, int $position): ?array {
                if (! $cell) {
                    return null;
                }

                return [
                    'position' => $position,
                    'item_id' => $cell['id'],
                    'level' => $cell['level'],
                ];
            })
            ->filter()
            ->values()
            ->all();

        $gameSave->boardItems()->createMany($items);
    }

    private function syncPacks(GameSave $gameSave, array $packs): void
    {
        $gameSave->packs()->delete();

        collect($packs)->each(function (array $pack, int $position) use ($gameSave): void {
            $savedPack = $gameSave->packs()->create([
                'pack_uid' => $pack['id'],
                'label' => $pack['label'],
                'position' => $position,
            ]);

            $savedPack->cards()->createMany(
                collect($pack['cards'])
                    ->map(fn (string $cardId, int $cardPosition): array => [
                        'card_id' => $cardId,
                        'position' => $cardPosition,
                    ])
                    ->all(),
            );
        });
    }

    private function syncClaimedMissions(GameSave $gameSave, array $missions): void
    {
        $gameSave->claimedMissions()->delete();

        $gameSave->claimedMissions()->createMany(
            collect($missions)
                ->unique()
                ->map(fn (string $missionId): array => ['mission_id' => $missionId])
                ->values()
                ->all(),
        );
    }

    private function activeCards(): array
    {
        if (! Schema::hasTable('cards')) {
            return [];
        }

        return Card::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->get()
            ->map(fn (Card $card): array => $card->toGameCard())
            ->all();
    }

    private function maxItemLevel(): int
    {
        if (! Schema::hasTable('merge_items')) {
            return self::FALLBACK_MAX_ITEM_LEVEL;
        }

        return max(self::FALLBACK_MAX_ITEM_LEVEL, (int) MergeItem::query()->max('level'));
    }

    private function activeCardRarities(): array
    {
        if (! Schema::hasTable('card_rarities')) {
            return [];
        }

        return CardRarity::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (CardRarity $rarity): array => $rarity->toGameRarity())
            ->all();
    }

    private function activeMissions(): array
    {
        if (! Schema::hasTable('missions')) {
            return [];
        }

        return Mission::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Mission $mission): array => $mission->toGameMission())
            ->all();
    }

    private function activeGamePacks(): array
    {
        if (! Schema::hasTable('game_packs')) {
            return [];
        }

        return GamePack::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (GamePack $pack): array => $pack->toGamePack())
            ->all();
    }

    private function activePlayerLevels(): array
    {
        if (! Schema::hasTable('player_levels')) {
            return [];
        }

        return PlayerLevel::query()
            ->where('is_active', true)
            ->orderBy('level')
            ->get()
            ->map(fn (PlayerLevel $level): array => $level->toGameLevel())
            ->all();
    }

    private function activeMergeItems(): array
    {
        if (! Schema::hasTable('merge_items')) {
            return [];
        }

        return MergeItem::query()
            ->where('is_active', true)
            ->orderBy('level')
            ->get()
            ->map(fn (MergeItem $item): array => $item->toGameItem())
            ->all();
    }

    private function gameConfig(): array
    {
        $settings = GameSetting::values([
            'max_energy' => self::MAX_ENERGY,
            'daily_reward_energy' => 30,
            'daily_reward_hearts' => 120,
        ]);

        return [
            'maxEnergy' => max(1, $settings['max_energy']),
            'dailyRewardEnergy' => max(0, $settings['daily_reward_energy']),
            'dailyRewardHearts' => max(0, $settings['daily_reward_hearts']),
        ];
    }

    private function gameRules(): array
    {
        $rules = GameRule::values([
            'magic_box_primary_level' => 1,
            'magic_box_bonus_level' => 2,
            'magic_box_bonus_chance_percent' => 18,
            'merge_pack_min_level' => 5,
            'merge_pack_chance_percent' => 8,
        ]);

        return [
            'magicBoxPrimaryLevel' => max(1, $rules['magic_box_primary_level']),
            'magicBoxBonusLevel' => max(1, $rules['magic_box_bonus_level']),
            'magicBoxBonusChancePercent' => min(max(0, $rules['magic_box_bonus_chance_percent']), 100),
            'mergePackMinLevel' => max(1, $rules['merge_pack_min_level']),
            'mergePackChancePercent' => min(max(0, $rules['merge_pack_chance_percent']), 100),
        ];
    }
}
