<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('user:make-admin {email}', function (string $email) {
    $user = User::query()->where('email', $email)->first();

    if (! $user) {
        $this->error("No user found for {$email}.");

        return 1;
    }

    $user->forceFill(['is_admin' => true])->save();

    $this->info("{$user->email} is now an administrator.");

    return 0;
})->purpose('Grant administrator access to a user by email');
