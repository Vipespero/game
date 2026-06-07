<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class GameSetting extends Model
{
    public $incrementing = false;

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'value',
    ];

    public static function values(array $defaults): array
    {
        if (! Schema::hasTable('game_settings')) {
            return $defaults;
        }

        $settings = self::query()
            ->whereIn('key', array_keys($defaults))
            ->pluck('value', 'key');

        return collect($defaults)
            ->map(fn (int $default, string $key): int => (int) ($settings[$key] ?? $default))
            ->all();
    }
}
