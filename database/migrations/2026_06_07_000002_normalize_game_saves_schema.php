<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('game_saves', 'energy')) {
            Schema::table('game_saves', function (Blueprint $table) {
                $table->unsignedTinyInteger('energy')->default(84)->after('user_id');
            });
        }

        if (! Schema::hasColumn('game_saves', 'hearts')) {
            Schema::table('game_saves', function (Blueprint $table) {
                $table->unsignedInteger('hearts')->default(120)->after('energy');
            });
        }

        if (! Schema::hasColumn('game_saves', 'xp')) {
            Schema::table('game_saves', function (Blueprint $table) {
                $table->unsignedInteger('xp')->default(0)->after('hearts');
            });
        }

        if (! Schema::hasColumn('game_saves', 'player_level')) {
            Schema::table('game_saves', function (Blueprint $table) {
                $table->unsignedSmallInteger('player_level')->default(1)->after('xp');
            });
        }

        if (! Schema::hasColumn('game_saves', 'merge_count')) {
            Schema::table('game_saves', function (Blueprint $table) {
                $table->unsignedInteger('merge_count')->default(0)->after('player_level');
            });
        }

        if (! Schema::hasColumn('game_saves', 'active_tab')) {
            Schema::table('game_saves', function (Blueprint $table) {
                $table->string('active_tab', 20)->default('merge')->after('merge_count');
            });
        }

        if (! Schema::hasColumn('game_saves', 'daily_reward_claimed_at')) {
            Schema::table('game_saves', function (Blueprint $table) {
                $table->timestamp('daily_reward_claimed_at')->nullable()->after('active_tab');
            });
        }

        if (! Schema::hasColumn('game_saves', 'last_seen_at')) {
            Schema::table('game_saves', function (Blueprint $table) {
                $table->timestamp('last_seen_at')->nullable()->after('daily_reward_claimed_at');
            });
        }

        $this->createNormalizedTables();

        if (Schema::hasColumn('game_saves', 'payload')) {
            $this->migratePayloadData();

            Schema::table('game_saves', function (Blueprint $table) {
                $table->dropColumn('payload');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('game_save_claimed_missions');
        Schema::dropIfExists('game_save_pack_cards');
        Schema::dropIfExists('game_save_packs');
        Schema::dropIfExists('game_save_board_items');

        $columns = [
            'energy',
            'hearts',
            'xp',
            'player_level',
            'merge_count',
            'active_tab',
            'daily_reward_claimed_at',
            'last_seen_at',
        ];

        foreach ($columns as $column) {
            if (Schema::hasColumn('game_saves', $column)) {
                Schema::table('game_saves', function (Blueprint $table) use ($column): void {
                    $table->dropColumn($column);
                });
            }
        }
    }

    private function createNormalizedTables(): void
    {
        if (! Schema::hasTable('game_save_board_items')) {
            Schema::create('game_save_board_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('game_save_id')->constrained()->cascadeOnDelete();
                $table->unsignedTinyInteger('position');
                $table->string('item_id', 64);
                $table->unsignedTinyInteger('level');
                $table->timestamps();

                $table->unique(['game_save_id', 'position']);
            });
        }

        if (! Schema::hasTable('game_save_packs')) {
            Schema::create('game_save_packs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('game_save_id')->constrained()->cascadeOnDelete();
                $table->string('pack_uid', 64);
                $table->string('label', 80);
                $table->unsignedSmallInteger('position')->default(0);
                $table->timestamps();

                $table->unique(['game_save_id', 'pack_uid']);
            });
        }

        if (! Schema::hasTable('game_save_pack_cards')) {
            Schema::create('game_save_pack_cards', function (Blueprint $table) {
                $table->id();
                $table->foreignId('game_save_pack_id')->constrained()->cascadeOnDelete();
                $table->string('card_id', 20);
                $table->unsignedTinyInteger('position');
                $table->timestamps();

                $table->unique(['game_save_pack_id', 'position']);
            });
        }

        if (! Schema::hasTable('game_save_claimed_missions')) {
            Schema::create('game_save_claimed_missions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('game_save_id')->constrained()->cascadeOnDelete();
                $table->string('mission_id', 40);
                $table->timestamps();

                $table->unique(['game_save_id', 'mission_id']);
            });
        }
    }

    private function migratePayloadData(): void
    {
        DB::table('game_saves')->orderBy('id')->each(function (object $save): void {
            $legacyPayload = json_decode($save->payload ?? '[]', true) ?: [];
            $now = now();

            DB::table('game_saves')
                ->where('id', $save->id)
                ->update([
                    'energy' => (int) min(max($legacyPayload['energy'] ?? 84, 0), 100),
                    'hearts' => (int) max($legacyPayload['hearts'] ?? 120, 0),
                    'xp' => (int) max($legacyPayload['xp'] ?? 0, 0),
                    'player_level' => (int) max($legacyPayload['playerLevel'] ?? 1, 1),
                    'merge_count' => (int) max($legacyPayload['mergeCount'] ?? 0, 0),
                    'active_tab' => in_array($legacyPayload['activeTab'] ?? 'merge', ['merge', 'album', 'room'], true) ? $legacyPayload['activeTab'] : 'merge',
                    'daily_reward_claimed_at' => $this->parseTimestamp($legacyPayload['dailyRewardClaimedAt'] ?? null),
                    'last_seen_at' => $this->parseTimestamp($legacyPayload['lastSeenAt'] ?? null),
                ]);

            foreach (array_slice($legacyPayload['board'] ?? [], 0, 25) as $position => $cell) {
                if (! is_array($cell) || ! isset($cell['level'])) {
                    continue;
                }

                DB::table('game_save_board_items')->insert([
                    'game_save_id' => $save->id,
                    'position' => $position,
                    'item_id' => (string) ($cell['id'] ?? ''),
                    'level' => (int) min(max($cell['level'], 1), 10),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            foreach (array_slice($legacyPayload['openedPacks'] ?? [], 0, 120) as $packPosition => $pack) {
                if (! is_array($pack) || empty($pack['id'])) {
                    continue;
                }

                $packId = DB::table('game_save_packs')->insertGetId([
                    'game_save_id' => $save->id,
                    'pack_uid' => (string) $pack['id'],
                    'label' => (string) ($pack['label'] ?? 'Sobre guardado'),
                    'position' => $packPosition,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                foreach (array_slice($pack['cards'] ?? [], 0, 3) as $cardPosition => $cardId) {
                    DB::table('game_save_pack_cards')->insert([
                        'game_save_pack_id' => $packId,
                        'card_id' => (string) $cardId,
                        'position' => $cardPosition,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }

            foreach (array_unique($legacyPayload['claimedMissions'] ?? []) as $missionId) {
                DB::table('game_save_claimed_missions')->insert([
                    'game_save_id' => $save->id,
                    'mission_id' => (string) $missionId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });
    }

    private function parseTimestamp(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateTimeString();
        } catch (Throwable) {
            return null;
        }
    }
};
