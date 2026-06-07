<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_saves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('energy')->default(84);
            $table->unsignedInteger('hearts')->default(120);
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedSmallInteger('player_level')->default(1);
            $table->unsignedInteger('merge_count')->default(0);
            $table->string('active_tab', 20)->default('merge');
            $table->timestamp('daily_reward_claimed_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });

        Schema::create('game_save_board_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_save_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->string('item_id', 64);
            $table->unsignedTinyInteger('level');
            $table->timestamps();

            $table->unique(['game_save_id', 'position']);
        });

        Schema::create('game_save_packs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_save_id')->constrained()->cascadeOnDelete();
            $table->string('pack_uid', 64);
            $table->string('label', 80);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['game_save_id', 'pack_uid']);
        });

        Schema::create('game_save_pack_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_save_pack_id')->constrained()->cascadeOnDelete();
            $table->string('card_id', 20);
            $table->unsignedTinyInteger('position');
            $table->timestamps();

            $table->unique(['game_save_pack_id', 'position']);
        });

        Schema::create('game_save_claimed_missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_save_id')->constrained()->cascadeOnDelete();
            $table->string('mission_id', 40);
            $table->timestamps();

            $table->unique(['game_save_id', 'mission_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_save_claimed_missions');
        Schema::dropIfExists('game_save_pack_cards');
        Schema::dropIfExists('game_save_packs');
        Schema::dropIfExists('game_save_board_items');
        Schema::dropIfExists('game_saves');
    }
};
