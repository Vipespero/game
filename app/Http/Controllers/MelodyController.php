<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MelodyController extends Controller
{
    private const BOARD_SIZE = 25;
    private const MAX_ENERGY = 100;
    private const MAX_ITEM_LEVEL = 10;
    private const MAX_PACK_HISTORY = 120;
    private const VALID_TABS = ['merge', 'album', 'room'];
    private const VALID_CARD_IDS = [
        'card-1',
        'card-2',
        'card-3',
        'card-4',
        'card-5',
        'card-6',
        'card-7',
        'card-8',
        'card-9',
        'card-10',
        'card-11',
        'card-12',
        'card-13',
        'card-14',
    ];

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
            'payload.board' => ['sometimes', 'array', 'size:'.self::BOARD_SIZE],
            'payload.board.*' => ['nullable', 'array'],
            'payload.board.*.id' => ['nullable', 'string', 'max:64'],
            'payload.board.*.level' => ['nullable', 'integer', 'min:1', 'max:'.self::MAX_ITEM_LEVEL],
            'payload.energy' => ['sometimes', 'integer', 'min:0', 'max:'.self::MAX_ENERGY],
            'payload.hearts' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'payload.xp' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'payload.playerLevel' => ['sometimes', 'integer', 'min:1', 'max:999'],
            'payload.mergeCount' => ['sometimes', 'integer', 'min:0', 'max:999999'],
            'payload.openedPacks' => ['sometimes', 'array', 'max:'.self::MAX_PACK_HISTORY],
            'payload.openedPacks.*' => ['array'],
            'payload.openedPacks.*.id' => ['required_with:payload.openedPacks', 'string', 'max:64'],
            'payload.openedPacks.*.label' => ['required_with:payload.openedPacks', 'string', 'max:80'],
            'payload.openedPacks.*.cards' => ['required_with:payload.openedPacks', 'array', 'min:1', 'max:3'],
            'payload.openedPacks.*.cards.*' => ['string', Rule::in(self::VALID_CARD_IDS)],
            'payload.activeTab' => ['sometimes', Rule::in(self::VALID_TABS)],
            'payload.claimedMissions' => ['sometimes', 'array', 'max:12'],
            'payload.claimedMissions.*' => ['string', 'max:40'],
            'payload.dailyRewardClaimedAt' => ['nullable', 'date'],
            'payload.lastSeenAt' => ['nullable', 'date'],
        ]);

        $payload = $this->sanitizePayload($validated['payload']);

        $request->user()->gameSave()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['payload' => $payload],
        );

        return response()->json([
            'saved' => true,
        ]);
    }

    /**
     * Keep client saves small and shaped like the game actually expects.
     */
    private function sanitizePayload(array $payload): array
    {
        $openedPacks = collect(Arr::get($payload, 'openedPacks', []))
            ->take(self::MAX_PACK_HISTORY)
            ->map(fn (array $pack): array => [
                'id' => (string) $pack['id'],
                'label' => (string) $pack['label'],
                'cards' => array_values(array_slice($pack['cards'], 0, 3)),
            ])
            ->all();

        return [
            'board' => $this->sanitizeBoard(Arr::get($payload, 'board', [])),
            'energy' => (int) Arr::get($payload, 'energy', 0),
            'hearts' => (int) Arr::get($payload, 'hearts', 0),
            'xp' => (int) Arr::get($payload, 'xp', 0),
            'playerLevel' => (int) Arr::get($payload, 'playerLevel', 1),
            'mergeCount' => (int) Arr::get($payload, 'mergeCount', 0),
            'openedPacks' => $openedPacks,
            'activeTab' => Arr::get($payload, 'activeTab', 'merge'),
            'claimedMissions' => array_values(array_unique(Arr::get($payload, 'claimedMissions', []))),
            'dailyRewardClaimedAt' => Arr::get($payload, 'dailyRewardClaimedAt'),
            'lastSeenAt' => now()->toISOString(),
        ];
    }

    private function sanitizeBoard(array $board): array
    {
        return collect($board)
            ->take(self::BOARD_SIZE)
            ->map(function (?array $cell): ?array {
                if (! $cell || ! isset($cell['level'])) {
                    return null;
                }

                return [
                    'id' => (string) ($cell['id'] ?? ''),
                    'level' => (int) $cell['level'],
                ];
            })
            ->pad(self::BOARD_SIZE, null)
            ->all();
    }
}
