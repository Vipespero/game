<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\MelodyController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', [MelodyController::class, 'show'])->name('melody');
    Route::get('dashboard', [MelodyController::class, 'show'])->name('dashboard');
    Route::put('melody/save', [MelodyController::class, 'save'])->name('melody.save');

    Route::get('admin', AdminDashboardController::class)
        ->middleware('admin')
        ->name('admin.dashboard');
});

require __DIR__.'/settings.php';
