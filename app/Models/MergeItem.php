<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MergeItem extends Model
{
    protected $fillable = [
        'level',
        'name',
        'symbol',
        'image_path',
        'xp',
        'hearts',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'xp' => 'integer',
            'hearts' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function toGameItem(): array
    {
        return [
            'level' => $this->level,
            'name' => $this->name,
            'symbol' => $this->symbol,
            'imagePath' => $this->image_path,
            'xp' => $this->xp,
            'hearts' => $this->hearts,
            'isActive' => $this->is_active,
        ];
    }
}
