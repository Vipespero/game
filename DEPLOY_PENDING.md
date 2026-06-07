# Deploy pendiente

No ejecutar aun si el VPS todavia no se va a actualizar.

Cuando toque desplegar, usar esta secuencia:

```bash
cd /www/wwwroot/game

git pull origin main

php artisan optimize:clear
php artisan migrate --force

php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder
php artisan db:seed --class=Database\\Seeders\\CardRaritySeeder
php artisan db:seed --class=Database\\Seeders\\CardSeeder
php artisan db:seed --class=Database\\Seeders\\GameSettingSeeder
php artisan db:seed --class=Database\\Seeders\\MergeItemSeeder
php artisan db:seed --class=Database\\Seeders\\MissionSeeder

npm run build

php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Verificaciones:

```sql
SHOW TABLES LIKE 'cards';
SHOW TABLES LIKE 'merge_items';
SHOW TABLES LIKE 'missions';
SHOW TABLES LIKE 'card_rarities';
SHOW TABLES LIKE 'game_settings';

SELECT level, name, image_path FROM merge_items ORDER BY level;
SELECT * FROM missions ORDER BY sort_order;
SELECT * FROM card_rarities ORDER BY sort_order;
SELECT * FROM game_settings ORDER BY `key`;
```

Recordatorio de admin:

```env
ADMIN_EMAILS=victorbastidasconta@gmail.com
```
