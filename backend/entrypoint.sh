#!/bin/bash
set -e

echo "Waiting for database..."
python << 'END'
import os, time, psycopg2
for _ in range(30):
    try:
        conn = psycopg2.connect(
            dbname=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD'],
            host=os.environ['DB_HOST'],
            port=os.environ.get('DB_PORT', '5432')
        )
        conn.close()
        print("Database is ready")
        break
    except Exception:
        time.sleep(2)
else:
    print("Database connection failed after 60 seconds")
    exit(1)
END

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
