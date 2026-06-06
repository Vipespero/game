<?php

use App\Http\Controllers\MelodyController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', [MelodyController::class, 'show'])->name('melody');
    Route::get('dashboard', [MelodyController::class, 'show'])->name('dashboard');
    Route::put('melody/save', [MelodyController::class, 'save'])->name('melody.save');
});

require __DIR__.'/settings.php';
