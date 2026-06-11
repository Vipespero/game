<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameSaveCollagePiece extends Model
{
    protected $fillable = [
        'game_save_id',
        'piece_id',
    ];

    public function gameSave(): BelongsTo
    {
        return $this->belongsTo(GameSave::class);
    }
}
