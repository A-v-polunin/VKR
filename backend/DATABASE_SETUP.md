# Настройка базы данных PostgreSQL для работы с картами

## Установка PostgreSQL и PostGIS

### Windows:

1. **Установите PostgreSQL:**
   - Скачайте с https://www.postgresql.org/download/windows/
   - При установке запомните пароль для пользователя `postgres`

2. **Установите PostGIS:**
   - Скачайте PostGIS для вашей версии PostgreSQL с https://postgis.net/windows_downloads/
   - Запустите установщик и выберите ту же версию PostgreSQL

3. **Создайте базу данных:**
   ```sql
   -- Подключитесь к PostgreSQL через pgAdmin или psql
   CREATE DATABASE sport_partner;
   
   -- Подключитесь к созданной базе и выполните:
   CREATE EXTENSION postgis;
   ```

### Linux (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis postgresql-14-postgis-3
sudo -u postgres createdb sport_partner
sudo -u postgres psql -d sport_partner -c "CREATE EXTENSION postgis;"
```

### macOS:

```bash
brew install postgresql postgis
createdb sport_partner
psql -d sport_partner -c "CREATE EXTENSION postgis;"
```

## Настройка переменных окружения

Добавьте в файл `.env`:

```env
DB_NAME=sport_partner
DB_USER=postgres
DB_PASSWORD=ваш_пароль
DB_HOST=localhost
DB_PORT=5432
```

## Миграция данных из SQLite (если нужно)

Если у вас уже есть данные в SQLite:

1. Создайте дамп:
   ```bash
   python manage.py dumpdata > data.json
   ```

2. Настройте PostgreSQL (см. выше)

3. Выполните миграции:
   ```bash
   python manage.py migrate
   ```

4. Загрузите данные:
   ```bash
   python manage.py loaddata data.json
   ```

## Проверка установки

```bash
python manage.py dbshell
```

В консоли PostgreSQL выполните:
```sql
SELECT PostGIS_version();
```

Если версия отображается - всё настроено правильно!
