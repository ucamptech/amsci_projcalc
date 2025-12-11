# Backend (AdonisJS)

How to configure and run the backend.

## 1) Environment

1. Copy the example env: `cp .env.example .env`
2. Update `.env`:
   - `APP_KEY` — generate one with `node ace generate:key` and paste it
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` — point to your database
   - Adjust `PORT`/`HOST` if needed (frontend expects `http://localhost:3333`)

## 2) Install

```bash
npm install
```

## 3) Database

- Run migrations: `node ace migration:run`
- Seed initial data (on a fresh DB): `node ace db:seed`

## 4) Run

```bash
npm run dev
```

The API will listen on the port defined in `.env` (default `3333`). Make sure the frontend `.env` `VITE_API_URL` matches `http://localhost:3333/api/v1`.
