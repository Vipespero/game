<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\CardRarity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CardController extends Controller
{
    private const RARITIES = ['C', 'R', 'SR', 'SSR', 'UR', 'SECRET'];

    public function index(): Response
    {
        if (! Schema::hasTable('cards')) {
            return Inertia::render('admin/cards/index', [
                'cards' => [],
                'catalogReady' => false,
            ]);
        }

        return Inertia::render('admin/cards/index', [
            'cards' => Card::query()
                ->orderBy('id')
                ->get()
                ->map(fn (Card $card): array => $this->serialize($card)),
            'catalogReady' => true,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/cards/form', [
            'card' => null,
            'rarities' => $this->rarities(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Card::query()->create($this->validated($request));

        return to_route('admin.cards.index');
    }

    public function edit(Card $card): Response
    {
        return Inertia::render('admin/cards/form', [
            'card' => $this->serialize($card),
            'rarities' => $this->rarities(),
        ]);
    }

    public function update(Request $request, Card $card): RedirectResponse
    {
        $card->update($this->validated($request, $card));

        return to_route('admin.cards.index');
    }

    public function destroy(Card $card): RedirectResponse
    {
        $card->update(['is_active' => false]);

        return to_route('admin.cards.index');
    }

    private function validated(Request $request, ?Card $card = null): array
    {
        return $request->validate([
            'external_id' => [
                'required',
                'string',
                'max:32',
                'regex:/^card-[0-9]+$/',
                Rule::unique('cards', 'external_id')->ignore($card),
            ],
            'name' => ['required', 'string', 'max:255'],
            'collection' => ['required', 'string', 'max:255'],
            'rarity' => ['required', Rule::in($this->rarities())],
            'image_path' => ['required', 'string', 'max:255'],
            'drop_weight' => ['required', 'integer', 'min:1', 'max:10000'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function serialize(Card $card): array
    {
        return [
            'id' => $card->id,
            'external_id' => $card->external_id,
            'name' => $card->name,
            'collection' => $card->collection,
            'rarity' => $card->rarity,
            'image_path' => $card->image_path,
            'drop_weight' => $card->drop_weight,
            'is_active' => $card->is_active,
        ];
    }

    private function rarities(): array
    {
        if (! Schema::hasTable('card_rarities')) {
            return self::RARITIES;
        }

        $rarities = CardRarity::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('code')
            ->all();

        return $rarities ?: self::RARITIES;
    }
}
