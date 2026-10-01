# TopicGym v1.0 · Backend (Compromiso 02)

API inicial del piloto de **Lógica de Programación** (1.º semestre).
Node.js + Express + PostgreSQL, sin ORM (SQL parametrizado con `pg`).

## Requisitos

- Node.js >= 18 (probado en Node 24)
- PostgreSQL 16+ (probado en PostgreSQL 18)

## Estructura

```
backend/
├── package.json            # dependencias y scripts
├── .env.example            # plantilla de variables de entorno (copiar a .env)
├── seed.js                 # crea esquema+datos si faltan, usuarios demo y verifica el banco
└── src/
    ├── app.js              # configuración de Express (middlewares, rutas)
    ├── server.js           # arranque del servidor
    ├── config/
    │   ├── env.js          # lectura centralizada de variables de entorno
    │   └── db.js           # pool de conexiones + transacciones + healthcheck
    ├── routes/             # definición de endpoints
    ├── controllers/        # capa HTTP (req/res)
    ├── services/           # lógica de negocio
    ├── repositories/       # acceso a datos (SQL)
    ├── middlewares/        # auth (JWT), validación (Zod), errores
    └── models/             # esquemas de dominio (Zod)
```

Flujo de una petición: **route → middleware → controller → service → repository → PostgreSQL**.

## Puesta en marcha

```powershell
cd backend
npm install
Copy-Item .env.example .env      # editar DB_PASSWORD y JWT_SECRET

# 1) Crear la base de datos (una sola vez)
#    Opción A: con psql del PATH o ruta completa
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE topicgym;"

# 2) Cargar esquema + datos + usuarios demo y verificar el banco
npm run seed

# 3) Arrancar la API
npm run dev      # http://localhost:3000
```

`npm run seed` es idempotente: si las tablas no existen, aplica `../database/schema.sql` y
`../database/seed.sql`; luego crea los usuarios demo con hash **bcrypt** y comprueba que los
5 ejercicios coincidan con `../banco-ejercicios/ejercicios_piloto.json`.

Reiniciar desde cero:

```powershell
node seed.js --reset
```

### Usuarios demo

| Correo | Contraseña | Rol |
| --- | --- | --- |
| estudiante.demo@institucion.edu.co | TopicGym2026 | ESTUDIANTE |
| docente.demo@institucion.edu.co | TopicGym2026 | DOCENTE |

## Scripts

| Script | Descripción |
| --- | --- |
| `npm start` | Arranca la API (`node src/server.js`). |
| `npm run dev` | Arranca con recarga automática (`nodemon`). |
| `npm run seed` | Crea/verifica datos y usuarios demo. |
| `npm run db:schema` | Aplica `schema.sql` con `psql`. |
| `npm run db:seed` | Aplica `seed.sql` con `psql`. |

## Endpoints

Base: `/api`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | — | Estado del servicio y de la BD. |
| POST | `/auth/login` | — | Inicia sesión (correo + contraseña) y devuelve JWT. |
| GET | `/auth/me` | JWT | Perfil del usuario autenticado. |
| POST | `/auth/logout` | — | Limpia la cookie de sesión. |
| GET | `/semesters` | — | Lista de semestres y su estado. |
| GET | `/semesters/:semestreId/subjects` | — | Asignaturas del semestre. |
| GET | `/subjects/:asignaturaId/topics` | — | Temas de la asignatura. |
| GET | `/topics/:temaId` | — | Tema con sus videos de apoyo. |
| GET | `/exercises?temaId=&nivel=` | JWT | Banco de ejercicios (sin revelar respuestas). |
| POST | `/exercises/:ejercicioId/validate` | JWT | Valida la respuesta y actualiza progreso/logros. |
| GET | `/progress` | JWT | Progreso por tema. |
| GET | `/achievements` | JWT | Logros obtenidos y pendientes. |
| GET | `/stats` | JWT | Puntos, aciertos y racha. |

Ejemplo:

```powershell
$body = '{"correo":"estudiante.demo@institucion.edu.co","password":"TopicGym2026"}'
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body $body
Invoke-RestMethod -Uri "http://localhost:3000/api/exercises?temaId=1" -Headers @{ Authorization = "Bearer $($r.token)" }
```

## Reglas de negocio del piloto

- Puntos solo en el **primer intento correcto** (ejercicio 1 y 2: 10 pts; 3 y 4: 25 pts; 5: 50 pts).
- La **respuesta correcta nunca viaja al cliente**: la validación ocurre en el servidor.
- Tipo `PSEUDOCODIGO`: se almacena para revisión manual (no se autocalifica en esta iteración).
- Logros: `PRIMER_ACIERTO`, `PRIMERA_SERIE`, `RACHA_INICIAL`, `MAESTRO_LOGICA`.

## Seguridad

- El archivo `.env` **no se versiona** (ver `.gitignore`); solo se comparte `.env.example`.
- Contraseñas con `bcryptjs`. Token JWT en cookie `httpOnly` y también en el cuerpo de la respuesta.
- `helmet` para cabeceras de seguridad y `express-rate-limit` en `/auth/login`.
