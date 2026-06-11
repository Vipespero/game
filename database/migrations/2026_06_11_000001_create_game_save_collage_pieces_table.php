<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collage_photos', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('label')->nullable();
            $table->unsignedTinyInteger('pieces_count')->default(16);
            $table->timestamps();
        });

        Schema::create('game_save_collage_pieces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_save_id')->constrained()->cascadeOnDelete();
            $table->string('piece_id', 20);
            $table->timestamps();

            $table->unique(['game_save_id', 'piece_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_save_collage_pieces');
        Schema::dropIfExists('collage_photos');
    }
};
