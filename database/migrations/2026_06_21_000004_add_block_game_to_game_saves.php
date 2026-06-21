<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_saves', function (Blueprint $table) {
            $table->json('block_board')->nullable()->after('active_tab');
            $table->json('block_pieces')->nullable()->after('block_board');
            $table->unsignedInteger('block_score')->default(0)->after('block_pieces');
            $table->unsignedInteger('block_best')->default(0)->after('block_score');
            $table->unsignedSmallInteger('block_combo')->default(0)->after('block_best');
        });
    }

    public function down(): void
    {
        Schema::table('game_saves', function (Blueprint $table) {
            $table->dropColumn([
                'block_board',
                'block_pieces',
                'block_score',
                'block_best',
                'block_combo',
            ]);
        });
    }
};
