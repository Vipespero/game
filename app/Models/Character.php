<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Character extends Model
{
    protected $fillable = [
        'name',
        'description',
        'glb_path',
        'preview_path',
        'emoji',
        'tags',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // URL pública del archivo GLB (servido por Nginx directamente)
    public function getGlbUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->glb_path);
    }

    // URL pública del thumbnail
    public function getPreviewUrlAttribute(): ?string
    {
        if (!$this->preview_path) return null;
        return Storage::disk('public')->url($this->preview_path);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
