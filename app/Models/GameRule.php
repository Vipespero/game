<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class GameRule extends Model
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
        if (! Schema::hasTable('game_rules')) {
            return $defaults;
        }

        $rules = self::query()
            ->whereIn('key', array_keys($defaults))
            ->pluck('value', 'key');

        return collect($defaults)
            ->map(fn (int $default, string $key): int => (int) ($rules[$key] ?? $default))
            ->all();
    }
}
