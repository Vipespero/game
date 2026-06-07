<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameSaveBoardItem extends Model
{
    protected $fillable = [
        'game_save_id',
        'position',
        'item_id',
        'level',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'position' => 'integer',
        ];
    }

    public function gameSave(): BelongsTo
    {
        return $this->belongsTo(GameSave::class);
    }
}
