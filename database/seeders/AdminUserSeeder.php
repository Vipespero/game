<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $emails = collect(config('app.admin_emails', []))
            ->map(fn (string $email): string => mb_strtolower(trim($email)))
            ->filter()
            ->unique();

        if ($emails->isEmpty()) {
            $this->command?->warn('No ADMIN_EMAILS configured. No admin users were updated.');

            return;
        }

        $updated = User::query()
            ->whereIn('email', $emails->all())
            ->update(['is_admin' => true]);

        $this->command?->info("Admin users updated: {$updated}");
    }
}
