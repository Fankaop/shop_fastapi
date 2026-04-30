# Shop Frontend + FastAPI Backend 

Монорепозиторий интернет-магазина:

- `backend/` — API на **FastAPI** + **SQLAlchemy**
- `frontend/` — клиент на **React + Vite**



## Стек

### Backend
- FastAPI
- SQLAlchemy
- PyMySQL
- Pydantic / pydantic-settings
- Uvicorn

### Frontend
- React
- Vite

---

## Структура проекта

```text
bd_st/
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ models/
│  │  ├─ repository/
│  │  ├─ schemas/
│  │  ├─ services/
│  │  ├─ config.py
│  │  ├─ database.py
│  │  └─ main.py
│  ├─ requirements.txt
│  └─ run.py
├─ frontend/
│  ├─ src/
│  ├─ package.json
│  └─ ...
└─ README.md
```

---

## Быстрый старт

### 1) Backend

Из папки `backend`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Backend стартует на `http://127.0.0.1:8000`.

Полезные ссылки:
- API root: `http://127.0.0.1:8000/`
- Health: `http://127.0.0.1:8000/health`
- Swagger: `http://127.0.0.1:8000/api/docs`
- ReDoc: `http://127.0.0.1:8000/api/redoc`

### 2) Frontend

Из папки `frontend`:

```bash
npm install
npm run dev
```

Frontend (Vite) обычно стартует на `http://localhost:5173`.

---

## Конфигурация

### Backend `.env`

Backend использует `pydantic-settings` и читает переменные из `.env`.

Основные параметры (см. `backend/app/config.py`):

- `app_name` (по умолчанию: `FastAPI Shop`)
- `debug` (по умолчанию: `True`)
- `database_url` (по умолчанию: `mysql+pymysql://root:12345@localhost:3306/shop_db`)
- `cors_origins`

Пример `.env` для `backend/`:

```env
APP_NAME=FastAPI Shop
DEBUG=True
DATABASE_URL=mysql+pymysql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:3306/<DB_NAME>
```

> Примечание: при запуске создаются таблицы через `Base.metadata.create_all(...)` (см. `init_db()` в `backend/app/database.py`).

---

## Что уже реализовано (master)

- Каталог товаров
- Категории
- Фильтрация товаров по категории через backend API
- Корзина
- Базовая авторизация/регистрация
- Статические ассеты и изображения
- Обновлённый UI каталога/авторизации/профиля

---

## Полезные команды

### Backend

```bash
# запуск
cd backend
python run.py
```

### Frontend

```bash
# разработка
cd frontend
npm run dev

# production build
npm run build
```

---

## Возможные проблемы

1. **CORS ошибки**
   - Проверь `cors_origins` в `backend/app/config.py`.

2. **Нет подключения к БД**
   - Проверь `DATABASE_URL`, доступность MySQL и существование базы `shop_db`.

3. **Frontend не видит backend**
   - Убедись, что backend запущен на `127.0.0.1:8000`.

---

## Лицензия

Учебный проект.
