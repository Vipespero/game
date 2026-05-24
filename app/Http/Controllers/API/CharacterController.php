<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CharacterResource;
use App\Models\Character;

class CharacterController extends Controller
{
    public function index()
    {
        $characters = Character::active()->get();
        return CharacterResource::collection($characters);
    }

    public function show(Character $character)
    {
        abort_unless($character->is_active, 404);

        return new CharacterResource($character);
    }
}
