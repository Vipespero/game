<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    protected $fillable = [
        'external_id',
        'label',
        'progress_key',
        'goal',
        'reward_hearts',
        'reward_energy',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'goal' => 'integer',
            'reward_hearts' => 'integer',
            'reward_energy' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function toGameMission(): array
    {
        return [
            'id' => $this->external_id,
            'label' => $this->label,
            'progressKey' => $this->progress_key,
            'goal' => $this->goal,
            'reward' => [
                'hearts' => $this->reward_hearts,
                'energy' => $this->reward_energy,
            ],
            'sortOrder' => $this->sort_order,
            'isActive' => $this->is_active,
        ];
    }
}
