<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MelodyController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('melody/index', [
            'gameSave' => $request->user()->gameSave?->payload,
        ]);
    }

    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payload' => ['required', 'array'],
        ]);

        $request->user()->gameSave()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['payload' => $validated['payload']],
        );

        return response()->json([
            'saved' => true,
        ]);
    }
}
