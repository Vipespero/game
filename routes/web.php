<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\BalanceController as AdminBalanceController;
use App\Http\Controllers\Admin\CardController as AdminCardController;
use App\Http\Controllers\MelodyController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', [MelodyController::class, 'show'])->name('melody');
    Route::get('dashboard', [MelodyController::class, 'show'])->name('dashboard');
    Route::put('melody/save', [MelodyController::class, 'save'])->name('melody.save');

    Route::get('admin', AdminDashboardController::class)
        ->middleware('admin')
        ->name('admin.dashboard');

    Route::middleware('admin')->group(function () {
        Route::get('admin/balance', [AdminBalanceController::class, 'edit'])->name('admin.balance.edit');
        Route::post('admin/balance', [AdminBalanceController::class, 'update'])->name('admin.balance.update');

        Route::get('admin/cards', [AdminCardController::class, 'index'])->name('admin.cards.index');
        Route::get('admin/cards/create', [AdminCardController::class, 'create'])->name('admin.cards.create');
        Route::post('admin/cards', [AdminCardController::class, 'store'])->name('admin.cards.store');
        Route::get('admin/cards/{card}/edit', [AdminCardController::class, 'edit'])->name('admin.cards.edit');
        Route::put('admin/cards/{card}', [AdminCardController::class, 'update'])->name('admin.cards.update');
        Route::delete('admin/cards/{card}', [AdminCardController::class, 'destroy'])->name('admin.cards.destroy');
    });
});

require __DIR__.'/settings.php';
