# Веб-приложение для агрегации и поиска партнера по спортивынм и развлекательным активностям

## Технологии

- **Backend**: Django + Django REST Framework + Django Channels (WebSocket)
- **Frontend**: React + Vite
- **База данных**: SQLite / PostgreSQL
- **WebSocket**: Django Channels
- **Telegram**: python-telegram-bot

## Установка

### Backend

1. Создайте виртуальное окружение:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` на основе `.env.example` и заполните настройки

4. Выполните миграции:
```bash
python manage.py migrate
```

5. Создайте суперпользователя:
```bash
python manage.py createsuperuser
```

6. Запустите сервер:
```bash
python manage.py runserver
```

7. Запустите Telegram бота (в отдельном терминале):
```bash
python telegram_bot/bot.py
```

### Frontend

1. Установите зависимости:
```bash
cd frontend
npm install
```

2. Запустите dev сервер:
```bash
npm run dev
```

## Функционал

### Гость (не авторизован)
- Просмотр публичных объявлений/мероприятий
- Поиск и фильтры (частично)
- Переход к регистрации/входу

### Пользователь (авторизован)
- Профиль + интересы
- Создание заявок/объявлений
- Отклики / заявки на участие
- Чат
- Добавление в избранное
- Участие в мероприятиях
- Отзывы/оценки
- Уведомления

### Администратор/модератор
- Модерация объявлений и профилей
- Управление категориями/справочниками
- Обработка жалоб
- Блокировки/бан
- Статистика

## Mobile-first дизайн

Приложение разработано с учётом мобильных устройств и адаптировано для всех размеров экранов.
