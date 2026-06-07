<?php

namespace Database\Seeders;

use App\Models\GameRule;
use Illuminate\Database\Seeder;

class GameRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            'magic_box_primary_level' => 1,
            'magic_box_bonus_level' => 2,
            'magic_box_bonus_chance_percent' => 18,
            'merge_pack_min_level' => 5,
            'merge_pack_chance_percent' => 8,
        ];

        foreach ($rules as $key => $value) {
            GameRule::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value],
            );
        }
    }
}
