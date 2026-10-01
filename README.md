# TopicGym - Proyecto final

Aplicacion web funcional para el aprendizaje de Logica de Programacion.

- **Backend**: Node.js + Express + PostgreSQL (`pg`).
- **Frontend**: Angular 22 (SPA, CSS propio).
- **Base de datos**: PostgreSQL 18, base `topicgym`.
- **Autenticacion**: login real (bcrypt + JWT) mediante cookie `httpOnly`.

## Estructura

```
Proyecto final/
  database/            Esquema y datos (schema.sql, seed.sql)
  backend/             API REST (Express + pg)
  frontend/            Aplicacion Angular 22
  banco-ejercicios/    Banco piloto de ejercicios (JSON)
```

## Requisitos

- Node.js `^22.22.3 || ^24.15.0 || >=26` (probado con v24.19.0)
- PostgreSQL 18 en ejecucion

## Puesta en marcha

### 1. Backend

```powershell
cd backend
npm install
npm run seed      # crea/actualiza schema, datos y usuarios demo
npm run dev       # http://localhost:3000
```

Credenciales de `.env` (ver `.env.example`). La base se llama `topicgym`.

### 2. Frontend

```powershell
cd frontend
npm install
npm start         # http://localhost:4200 (proxy /api -> http://localhost:3000)
```

## Usuarios demo

| Rol        | Correo                             | Contrasena    |
|------------|------------------------------------|---------------|
| Estudiante | estudiante.demo@institucion.edu.co | TopicGym2026  |
| Docente    | docente.demo@institucion.edu.co    | TopicGym2026  |

## API (resumen)

- `GET  /api/health`
- `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/logout`
- `GET  /api/semesters` · `GET /api/semesters/:id/subjects`
- `GET  /api/subjects/:id/topics` · `GET /api/topics/:id`
- `GET  /api/exercises?temaId=&nivel=`
- `POST /api/exercises/:id/validate`
- `GET  /api/progress` · `GET /api/achievements` · `GET /api/stats`
