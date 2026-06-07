<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerLevel extends Model
{
    protected $fillable = [
        'level',
        'xp_required',
        'reward_energy',
        'reward_pack_trigger',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'xp_required' => 'integer',
            'reward_energy' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function toGameLevel(): array
    {
        return [
            'level' => $this->level,
            'xpRequired' => $this->xp_required,
            'rewardEnergy' => $this->reward_energy,
            'rewardPackTrigger' => $this->reward_pack_trigger,
            'isActive' => $this->is_active,
        ];
    }
}
