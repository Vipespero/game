<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    protected $fillable = [
        'external_id',
        'name',
        'collection',
        'rarity',
        'image_path',
        'drop_weight',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'drop_weight' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function toGameCard(): array
    {
        return [
            'id' => $this->external_id,
            'name' => $this->name,
            'collection' => $this->collection,
            'rarity' => $this->rarity,
            'flavor' => "{$this->rarity} - {$this->collection}",
            'imagePath' => $this->image_path,
            'dropWeight' => $this->drop_weight,
            'isActive' => $this->is_active,
        ];
    }
}
