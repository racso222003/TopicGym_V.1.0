# TopicGym v1.0 · Documentación de la API

Referencia completa de la API REST del piloto de **Lógica de Programación**.

- **Base URL (desarrollo):** `http://localhost:3000/api`
- **Formato:** JSON (`application/json`)
- **Compromiso 04 · Acta 06:** esta documentación amplía la del Acta 02 e incluye
  seguridad (rate limit, CORS, validación) y ejemplos de petición/respuesta.

## Autenticación

El inicio de sesión emite un **JWT** que se entrega:

1. como cookie `httpOnly` (`sameSite=lax`, `secure` en producción), **y**
2. en el campo `token` del cuerpo de la respuesta (para clientes que no usan cookies).

Las rutas marcadas como **JWT** requieren haber enviado la cookie de sesión
(con `withCredentials`/`credentials: include`) o bien el encabezado
`Authorization: Bearer <token>`.

## Códigos de estado

| Código | Uso |
| --- | --- |
| `200` | Éxito. |
| `400` | Entrada inválida (validación Zod); cuerpo `{ "error", "detalles": [...] }`. |
| `401` | Sin sesión o token inválido/vencido. |
| `404` | Recurso no encontrado. |
| `429` | Limite de peticiones alcanzado (rate limit). |
| `500` | Error interno del servidor (se registra en consola, no se detalla). |

### Formato de error de validación

```json
{
  "error": "Datos inválidos.",
  "detalles": [{ "campo": "correo", "mensaje": "Correo institucional inválido." }]
}
```

### Errores de negocio

```json
{ "error": "Ejercicio 999 no encontrado." }
{ "error": "Debes seleccionar una opción de respuesta." }
```

## Endpoints

### `GET /health`

Estado de la API y de la conexión a PostgreSQL. Sin autenticación.

```json
{
  "status": "ok",
  "db": "up",
  "uptime": 12.34
}
```

### `POST /auth/login`

Inicia sesión con correo institucional y contraseña.

- **Rate limit:** 10 intentos cada 10 minutos (más un límite global).
- Cuerpo:

```json
{
  "correo": "estudiante.demo@institucion.edu.co",
  "password": "TopicGym2026"
}
```

- Respuesta `200`:

```json
{
  "usuario": {
    "id": "f5b8c8f0-...",
    "nombre": "Estudiante Demo",
    "correo": "estudiante.demo@institucion.edu.co",
    "rol": "ESTUDIANTE"
  },
  "token": "<jwt>"
}
```

### `GET /auth/me`

Perfil del usuario autenticado (requiere JWT).

```json
{ "usuario": { "id": "...", "nombre": "Estudiante Demo", "correo": "...@institucion.edu.co", "rol": "ESTUDIANTE" } }
```

### `POST /auth/logout`

Limpia la cookie de sesión.

```json
{ "ok": true }
```

### `GET /semesters`

Lista de semestres y su estado (`ACTIVO` / `PROXIMAMENTE`).

```json
{
  "semestres": [
    { "id": 1, "numero": 1, "nombre": "Semestre 1", "estado": "ACTIVO" }
  ]
}
```

### `GET /semesters/:semestreId/subjects`

Asignaturas del semestre.

```json
{
  "asignaturas": [
    { "id": 1, "nombre": "Lógica de Programación", "orden": 1 }
  ]
}
```

### `GET /subjects/:asignaturaId/topics`

Temas de la asignatura.

```json
{
  "temas": [
    {
      "id": 1,
      "titulo": "Variables y tipos de datos",
      "descripcion": "Declaración, asignación y tipos básicos: entero, real, texto y booleano.",
      "dificultad_base": "BASICO",
      "orden": 1
    }
  ]
}
```

### `GET /topics/:temaId`

Detalle del tema con sus videos de apoyo.

```json
{
  "tema": {
    "id": 1,
    "titulo": "Variables y tipos de datos",
    "descripcion": "…",
    "dificultad_base": "BASICO",
    "asignatura": "Lógica de Programación",
    "semestre_numero": 1,
    "orden": 1,
    "videos": [
      {
        "id": 1,
        "titulo": "Variables y tipos de datos desde cero",
        "url_youtube": "https://www.youtube.com/results?search_query=...",
        "duracion_seg": 620,
        "orden": 1
      }
    ]
  }
}
```

### `GET /exercises?temaId=<id>&nivel=<FACIL|MEDIO|DIFICIL>`

Banco de ejercicios de un tema. **No expone la respuesta correcta.**

- `temaId` es obligatorio; `nivel` es opcional (filtro).

```json
{
  "ejercicios": [
    {
      "id": 11,
      "nivel": "FACIL",
      "tipo": "OPCION_MULTIPLE",
      "titulo": "…",
      "enunciado": "…",
      "codigo_referencia": "…",
      "pista": "…",
      "puntos_ponderados": 10,
      "orden": 11,
      "opciones": [
        { "id": 41, "texto": "…", "orden": 1 }
      ]
    }
  ]
}
```

### `POST /exercises/:ejercicioId/validate`

Valida la respuesta del estudiante y actualiza progreso/logros (requiere JWT).

- Cuerpo (ejercicio de opción múltiple):

```json
{ "opcionId": 42 }
```

- Cuerpo (ejercicio libre en pseudocódigo):

```json
{ "textoRespuesta": "contador = contador + 1" }
```

- Reglas:
  - Puntos solo en el **primer intento correcto**.
  - El ejercicio debe ser del banco (404 si no existe).
  - Se devuelve la **explicación** y el **id de la opción correcta** al resolver.

- Respuesta `200`:

```json
{
  "correcta": true,
  "puntos": 10,
  "intento": 1,
  "primerIntento": true,
  "explicacion": "…",
  "opcionCorrectaId": 42,
  "logros": [
    { "codigo": "PRIMER_ACIERTO", "nombre": "Primer acierto", "puntos": 5 }
  ]
}
```

### `GET /progress`

Progreso por tema del estudiante (requiere JWT).

```json
{
  "progreso": [
    { "tema_id": 1, "tema": "Variables y tipos de datos", "ejercicios_resueltos": 3, "puntos": 45, "actualizado_en": "2026-10-06T20:00:00.000Z" }
  ]
}
```

### `GET /achievements`

Logros del estudiante: obtenidos y pendientes (requiere JWT).

```json
{
  "logros": [
    { "id": 1, "codigo": "PRIMER_ACIERTO", "nombre": "Primer acierto", "descripcion": "…", "puntos": 5, "obtenido": true, "obtenido_en": "2026-10-06T20:00:00.000Z" }
  ]
}
```

### `GET /stats`

Resumen de puntos, aciertos, intentos y rachas (requiere JWT).

```json
{
  "stats": {
    "puntos_totales": 45,
    "aciertos": 3,
    "intentos": 5,
    "racha_actual": 1,
    "racha_maxima": 1,
    "dias_activos": 2
  }
}
```

## Seguridad (Compromiso 04 · Acta 06)

- **Rate limit global:** `API_RATE_MAX` peticiones por `API_RATE_WINDOW_MS` en
  toda la API (por defecto 300 peticiones/10 min). Respuesta `429`.
- **Rate limit de login:** `AUTH_RATE_MAX` por `AUTH_RATE_WINDOW_MS` (10 cada 10 min)
  para mitigar fuerza bruta.
- **CORS:** solo orígenes de `CORS_ORIGINS` (lista separada por comas); métodos y
  cabeceras restringidas.
- **Cabeceras HTTP:** `helmet`.
- **Validación de entrada:** Zod en cada endpoint (params, query y body).
- **Contraseñas:** `bcryptjs`. **Sesión:** JWT en cookie `httpOnly`.
- **`.env`:** nunca se versiona; se comparte solo `.env.example` (ver `.gitignore`).

## Scripts útiles

```powershell
cd backend
npm run seed            # crea/verifica esquema, datos y usuarios demo
npm run dev             # API en http://localhost:3000
node scripts/smoke.js   # pruebas de regresión end-to-end (Compromiso 05 · Acta 06)
```