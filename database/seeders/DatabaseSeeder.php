<?php

namespace Database\Seeders;

use App\Models\User;
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
        $this->call(GameSettingSeeder::class);
        $this->call(MergeItemSeeder::class);
        $this->call(MissionSeeder::class);

        if (app()->environment(['local', 'testing'])) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }
    }
}
