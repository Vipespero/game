<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameSave;
use App\Models\User;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $saves = GameSave::query()
            ->with('user:id,name,email,is_admin,created_at')
            ->latest('updated_at')
            ->get();

        $activeToday = $saves
            ->filter(fn (GameSave $save): bool => now()->diffInHours($save->updated_at) < 24)
            ->count();

        $totalHearts = $saves->sum(fn (GameSave $save): int => (int) Arr::get($save->payload, 'hearts', 0));
        $totalMerges = $saves->sum(fn (GameSave $save): int => (int) Arr::get($save->payload, 'mergeCount', 0));
        $totalCards = $saves->sum(fn (GameSave $save): int => $this->uniqueCardCount($save));
        $playersWithSaves = $saves->mapWithKeys(fn (GameSave $save): array => [
            $save->user_id => [
                'id' => $save->user?->id,
                'name' => $save->user?->name ?? 'Jugador eliminado',
                'email' => $save->user?->email ?? '',
                'isAdmin' => (bool) $save->user?->is_admin,
                'hearts' => (int) Arr::get($save->payload, 'hearts', 0),
                'energy' => (int) Arr::get($save->payload, 'energy', 0),
                'level' => (int) Arr::get($save->payload, 'playerLevel', 1),
                'merges' => (int) Arr::get($save->payload, 'mergeCount', 0),
                'cards' => $this->uniqueCardCount($save),
                'activeTab' => Arr::get($save->payload, 'activeTab', 'merge'),
                'updatedAt' => $save->updated_at?->diffForHumans(),
            ],
        ]);
        $playersWithoutSaves = User::query()
            ->whereNotIn('id', $playersWithSaves->keys())
            ->latest()
            ->take(30)
            ->get(['id', 'name', 'email', 'is_admin'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'isAdmin' => $user->is_admin,
                'hearts' => 0,
                'energy' => 0,
                'level' => 1,
                'merges' => 0,
                'cards' => 0,
                'activeTab' => 'sin partida',
                'updatedAt' => null,
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'users' => User::query()->count(),
                'admins' => User::query()->where('is_admin', true)->count(),
                'saves' => $saves->count(),
                'activeToday' => $activeToday,
                'totalHearts' => $totalHearts,
                'totalMerges' => $totalMerges,
                'totalCards' => $totalCards,
            ],
            'players' => $playersWithSaves->values()->merge($playersWithoutSaves)->take(30)->values(),
        ]);
    }

    private function uniqueCardCount(GameSave $save): int
    {
        return collect(Arr::get($save->payload, 'openedPacks', []))
            ->flatMap(fn (array $pack): array => Arr::get($pack, 'cards', []))
            ->unique()
            ->count();
    }
}
