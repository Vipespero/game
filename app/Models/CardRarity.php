<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardRarity extends Model
{
    protected $fillable = [
        'code',
        'name',
        'duplicate_hearts',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'duplicate_hearts' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function toGameRarity(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'duplicateHearts' => $this->duplicate_hearts,
            'sortOrder' => $this->sort_order,
            'isActive' => $this->is_active,
        ];
    }
}
