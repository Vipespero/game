<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameSavePackCard extends Model
{
    protected $fillable = [
        'game_save_pack_id',
        'card_id',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
        ];
    }

    public function pack(): BelongsTo
    {
        return $this->belongsTo(GameSavePack::class, 'game_save_pack_id');
    }
}
