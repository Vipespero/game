<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CardRarity;
use App\Models\GamePack;
use App\Models\GameRule;
use App\Models\GameSetting;
use App\Models\MergeItem;
use App\Models\Mission;
use App\Models\PlayerLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BalanceController extends Controller
{
    private const PROGRESS_KEYS = ['merge_count', 'collected_cards', 'hearts'];
    private const TRIGGER_KEYS = ['premium', 'daily', 'level', 'merge'];

    public function edit(): Response
    {
        return Inertia::render('admin/balance', [
            'ready' => $this->ready(),
            'settings' => $this->settings(),
            'rules' => $this->rules(),
            'rarities' => $this->rarities(),
            'missions' => $this->missions(),
            'mergeItems' => $this->mergeItems(),
            'packs' => $this->packs(),
            'playerLevels' => $this->playerLevels(),
            'progressKeys' => self::PROGRESS_KEYS,
            'triggerKeys' => self::TRIGGER_KEYS,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($this->ready(), 409);

        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string', 'max:80', Rule::exists('game_settings', 'key')],
            'settings.*.value' => ['required', 'integer', 'min:0', 'max:999999'],

            'rules' => ['required', 'array'],
            'rules.*.key' => ['required', 'string', 'max:80', Rule::exists('game_rules', 'key')],
            'rules.*.value' => ['required', 'integer', 'min:0', 'max:999999'],

            'rarities' => ['required', 'array'],
            'rarities.*.id' => ['required', 'integer', Rule::exists('card_rarities', 'id')],
            'rarities.*.name' => ['required', 'string', 'max:80'],
            'rarities.*.duplicate_hearts' => ['required', 'integer', 'min:0', 'max:999999'],
            'rarities.*.sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'rarities.*.is_active' => ['required', 'boolean'],

            'missions' => ['required', 'array'],
            'missions.*.id' => ['required', 'integer', Rule::exists('missions', 'id')],
            'missions.*.label' => ['required', 'string', 'max:255'],
            'missions.*.progress_key' => ['required', Rule::in(self::PROGRESS_KEYS)],
            'missions.*.goal' => ['required', 'integer', 'min:1', 'max:999999'],
            'missions.*.reward_hearts' => ['required', 'integer', 'min:0', 'max:999999'],
            'missions.*.reward_energy' => ['required', 'integer', 'min:0', 'max:999999'],
            'missions.*.sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'missions.*.is_active' => ['required', 'boolean'],

            'mergeItems' => ['required', 'array'],
            'mergeItems.*.id' => ['required', 'integer', Rule::exists('merge_items', 'id')],
            'mergeItems.*.name' => ['required', 'string', 'max:255'],
            'mergeItems.*.image_path' => ['nullable', 'string', 'max:255'],
            'mergeItems.*.background_style' => ['nullable', 'string', 'max:255'],
            'mergeItems.*.border_radius' => ['required', 'string', 'max:32'],
            'mergeItems.*.image_size' => ['required', 'integer', 'min:20', 'max:160'],
            'mergeItems.*.image_offset_x' => ['required', 'integer', 'min:-100', 'max:100'],
            'mergeItems.*.image_offset_y' => ['required', 'integer', 'min:-100', 'max:100'],
            'mergeItems.*.xp' => ['required', 'integer', 'min:0', 'max:999999'],
            'mergeItems.*.hearts' => ['required', 'integer', 'min:0', 'max:999999'],
            'mergeItems.*.is_active' => ['required', 'boolean'],

            'packs' => ['required', 'array'],
            'packs.*.id' => ['required', 'integer', Rule::exists('game_packs', 'id')],
            'packs.*.label' => ['required', 'string', 'max:80'],
            'packs.*.trigger_key' => ['required', Rule::in(self::TRIGGER_KEYS)],
            'packs.*.cost_hearts' => ['required', 'integer', 'min:0', 'max:999999'],
            'packs.*.cards_count' => ['required', 'integer', 'min:1', 'max:3'],
            'packs.*.sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'packs.*.is_active' => ['required', 'boolean'],

            'playerLevels' => ['required', 'array'],
            'playerLevels.*.id' => ['required', 'integer', Rule::exists('player_levels', 'id')],
            'playerLevels.*.xp_required' => ['required', 'integer', 'min:1', 'max:9999999'],
            'playerLevels.*.reward_energy' => ['required', 'integer', 'min:0', 'max:999999'],
            'playerLevels.*.reward_pack_trigger' => ['nullable', Rule::in(self::TRIGGER_KEYS)],
            'playerLevels.*.is_active' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($validated): void {
            foreach ($validated['settings'] as $setting) {
                GameSetting::query()->where('key', $setting['key'])->update(['value' => (string) $setting['value']]);
            }

            foreach ($validated['rules'] as $rule) {
                GameRule::query()->where('key', $rule['key'])->update(['value' => (string) $rule['value']]);
            }

            foreach ($validated['rarities'] as $rarity) {
                CardRarity::query()->whereKey($rarity['id'])->update(collect($rarity)->except('id')->all());
            }

            foreach ($validated['missions'] as $mission) {
                Mission::query()->whereKey($mission['id'])->update(collect($mission)->except('id')->all());
            }

            foreach ($validated['mergeItems'] as $item) {
                MergeItem::query()->whereKey($item['id'])->update(collect($item)->except('id')->all());
            }

            foreach ($validated['packs'] as $pack) {
                GamePack::query()->whereKey($pack['id'])->update(collect($pack)->except('id')->all());
            }

            foreach ($validated['playerLevels'] as $level) {
                PlayerLevel::query()->whereKey($level['id'])->update(collect($level)->except('id')->all());
            }
        });

        $this->clearGameCache();

        return to_route('admin.balance.edit');
    }

    private function clearGameCache(): void
    {
        foreach ([
            'game.card_rarities',
            'game.config',
            'game.max_item_level',
            'game.merge_items',
            'game.missions',
            'game.packs',
            'game.player_levels',
            'game.rules',
        ] as $key) {
            Cache::forget($key);
        }
    }

    private function ready(): bool
    {
        return Schema::hasTable('game_settings')
            && Schema::hasTable('card_rarities')
            && Schema::hasTable('missions')
            && Schema::hasTable('merge_items')
            && Schema::hasTable('game_packs')
            && Schema::hasTable('game_rules')
            && Schema::hasTable('player_levels');
    }

    private function settings(): array
    {
        if (! Schema::hasTable('game_settings')) {
            return [];
        }

        return GameSetting::query()->orderBy('key')->get(['key', 'value'])->all();
    }

    private function rules(): array
    {
        if (! Schema::hasTable('game_rules')) {
            return [];
        }

        return GameRule::query()->orderBy('key')->get(['key', 'value'])->all();
    }

    private function rarities(): array
    {
        if (! Schema::hasTable('card_rarities')) {
            return [];
        }

        return CardRarity::query()->orderBy('sort_order')->get()->all();
    }

    private function missions(): array
    {
        if (! Schema::hasTable('missions')) {
            return [];
        }

        return Mission::query()->orderBy('sort_order')->get()->all();
    }

    private function mergeItems(): array
    {
        if (! Schema::hasTable('merge_items')) {
            return [];
        }

        return MergeItem::query()->orderBy('level')->get()->all();
    }

    private function packs(): array
    {
        if (! Schema::hasTable('game_packs')) {
            return [];
        }

        return GamePack::query()->orderBy('sort_order')->get()->all();
    }

    private function playerLevels(): array
    {
        if (! Schema::hasTable('player_levels')) {
            return [];
        }

        return PlayerLevel::query()->orderBy('level')->get()->all();
    }
}
