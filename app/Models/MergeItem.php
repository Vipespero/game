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
        'background_style',
        'border_radius',
        'image_size',
        'image_offset_x',
        'image_offset_y',
        'xp',
        'hearts',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'image_size' => 'integer',
            'image_offset_x' => 'integer',
            'image_offset_y' => 'integer',
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
            'backgroundStyle' => $this->background_style,
            'borderRadius' => $this->border_radius,
            'imageSize' => $this->image_size,
            'imageOffsetX' => $this->image_offset_x,
            'imageOffsetY' => $this->image_offset_y,
            'xp' => $this->xp,
            'hearts' => $this->hearts,
            'isActive' => $this->is_active,
        ];
    }
}
