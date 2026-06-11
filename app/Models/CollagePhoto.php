<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CollagePhoto extends Model
{
    protected $fillable = [
        'filename',
        'label',
        'pieces_count',
    ];

    protected function casts(): array
    {
        return [
            'pieces_count' => 'integer',
        ];
    }

    public function toGameCollage(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label ?: 'Recuerdo secreto',
            'url' => '/storage/collage/'.$this->filename,
            'piecesCount' => $this->pieces_count,
        ];
    }
}
