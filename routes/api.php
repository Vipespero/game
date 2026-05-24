<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\CharacterController;
use App\Http\Controllers\API\TattooDesignController;

Route::get('/user', function (Request $request) { return $request->user(); })->middleware('auth:sanctum');
Route::prefix('v1')->group(function () {
    Route::apiResource('characters', CharacterController::class)->only(['index', 'show']);
    Route::apiResource('designs', TattooDesignController::class)->only(['index', 'show']);
});
