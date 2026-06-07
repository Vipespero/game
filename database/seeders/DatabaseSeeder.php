<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);
        $this->call(CardRaritySeeder::class);
        $this->call(CardSeeder::class);
        $this->call(GamePackSeeder::class);
        $this->call(GameRuleSeeder::class);
        $this->call(GameSettingSeeder::class);
        $this->call(MergeItemSeeder::class);
        $this->call(MissionSeeder::class);
        $this->call(PlayerLevelSeeder::class);
    }
}
