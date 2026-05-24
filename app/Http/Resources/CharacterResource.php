<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CharacterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'glb_url'     => $this->glb_url,
            'preview_url' => $this->preview_url,
            'emoji'       => $this->emoji,
            'tags'        => $this->tags,
        ];
    }
}
