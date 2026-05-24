<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TattooDesignResource;
use App\Models\TattooDesign;

class TattooDesignController extends Controller
{
    public function index()
    {
        $designs = TattooDesign::active()->get();
        return TattooDesignResource::collection($designs);
    }

    public function show(TattooDesign $design)
    {
        abort_unless($design->is_active, 404);

        return new TattooDesignResource($design);
    }
}
