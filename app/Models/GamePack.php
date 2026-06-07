<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GamePack extends Model
{
    protected $fillable = [
        'external_id',
        'label',
        'trigger_key',
        'cost_hearts',
        'cards_count',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'cost_hearts' => 'integer',
            'cards_count' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function toGamePack(): array
    {
        return [
            'id' => $this->external_id,
            'label' => $this->label,
            'triggerKey' => $this->trigger_key,
            'costHearts' => $this->cost_hearts,
            'cardsCount' => $this->cards_count,
            'sortOrder' => $this->sort_order,
            'isActive' => $this->is_active,
        ];
    }
}
