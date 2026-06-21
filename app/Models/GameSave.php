<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameSave extends Model
{
    private const BOARD_SIZE = 30;

    protected $fillable = [
        'user_id',
        'energy',
        'hearts',
        'xp',
        'player_level',
        'merge_count',
        'active_tab',
        'block_board',
        'block_pieces',
        'block_score',
        'block_best',
        'block_combo',
        'daily_reward_claimed_at',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'daily_reward_claimed_at' => 'datetime',
            'energy' => 'integer',
            'block_board' => 'array',
            'block_pieces' => 'array',
            'block_score' => 'integer',
            'block_best' => 'integer',
            'block_combo' => 'integer',
            'hearts' => 'integer',
            'last_seen_at' => 'datetime',
            'merge_count' => 'integer',
            'player_level' => 'integer',
            'xp' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function boardItems(): HasMany
    {
        return $this->hasMany(GameSaveBoardItem::class);
    }

    public function packs(): HasMany
    {
        return $this->hasMany(GameSavePack::class);
    }

    public function claimedMissions(): HasMany
    {
        return $this->hasMany(GameSaveClaimedMission::class);
    }

    public function collagePieces(): HasMany
    {
        return $this->hasMany(GameSaveCollagePiece::class);
    }

    public function toGameState(): array
    {
        $board = array_fill(0, self::BOARD_SIZE, null);

        $this->boardItems
            ->sortBy('position')
            ->each(function (GameSaveBoardItem $item) use (&$board): void {
                if ($item->position < 0 || $item->position >= count($board)) {
                    return;
                }

                $board[$item->position] = [
                    'id' => $item->item_id,
                    'level' => $item->level,
                ];
            });

        return [
            'board' => $board,
            'energy' => $this->energy,
            'hearts' => $this->hearts,
            'xp' => $this->xp,
            'playerLevel' => $this->player_level,
            'mergeCount' => $this->merge_count,
            'openedPacks' => $this->packs
                ->sortBy('position')
                ->map(fn (GameSavePack $pack): array => [
                    'id' => $pack->pack_uid,
                    'label' => $pack->label,
                    'cards' => $pack->cards->sortBy('position')->pluck('card_id')->values()->all(),
                ])
                ->values()
                ->all(),
            'activeTab' => $this->active_tab,
            'claimedMissions' => $this->claimedMissions
                ->pluck('mission_id')
                ->values()
                ->all(),
            'collagePieces' => $this->collagePieces
                ->pluck('piece_id')
                ->values()
                ->all(),
            'blockBoard' => $this->block_board ?? array_fill(0, 64, 0),
            'blockPieces' => $this->block_pieces ?? [],
            'blockScore' => $this->block_score ?? 0,
            'blockBest' => $this->block_best ?? 0,
            'blockCombo' => $this->block_combo ?? 0,
            'dailyRewardClaimedAt' => $this->daily_reward_claimed_at?->toISOString(),
            'lastSeenAt' => $this->last_seen_at?->toISOString(),
        ];
    }
}
