'use strict';

// ============================================================================
//  TopicGym v1.0 · Pruebas de regresión end-to-end (Compromiso 05 · Acta 06)
// ----------------------------------------------------------------------------
//  Uso (desde backend/, con la API corriendo en http://localhost:3000):
//    node scripts/smoke.js
//    BASE_URL=http://localhost:3000/api node scripts/smoke.js
//
//  Cubre: salud, autenticación (login/me/logout), catálogo, banco ampliado,
//  validación de respuestas (regla del primer intento), progreso, logros,
//  estadísticas, validación de entrada (400) y seguridad de rutas (401/404).
//  Termina con código 0 si todo PASA, 1 si hay algún fallo.
// ============================================================================

const { pool } = require('../src/config/db');

const BASE = process.env.BASE_URL || 'http://localhost:3000/api';
const EMAIL = process.env.SMOKE_EMAIL || 'estudiante.demo@institucion.edu.co';
const PASSWORD = process.env.SMOKE_PASSWORD || 'TopicGym2026';

let pasaron = 0;
let fallaron = 0;
const fallos = [];

// Limpia los intentos, progreso y logros del usuario demo para que el acierto
// del primer intento sea reproducible en cada ejecución (fixture idempotente).
async function limpiarFixture() {
  const { rows } = await pool.query(
    `SELECT id FROM usuarios WHERE correo_institucional = $1`,
    [EMAIL],
  );
  if (rows.length === 0) return;
  const { id } = rows[0];
  await pool.query('DELETE FROM logros_obtenidos WHERE usuario_id = $1', [id]);
  await pool.query('DELETE FROM respuestas_estudiante WHERE usuario_id = $1', [id]);
  await pool.query('DELETE FROM progreso_estudiante WHERE usuario_id = $1', [id]);
}

function reportar(nombre, condicion, detalle) {
  if (condicion) {
    pasaron += 1;
    console.log(`   ✓ ${nombre}`);
  } else {
    fallaron += 1;
    fallos.push(`${nombre}: ${detalle}`);
    console.log(`   ✗ ${nombre} — ${detalle}`);
  }
}

async function pedir(ruta, opciones = {}) {
  const { headers, ...rest } = opciones;
  const res = await fetch(`${BASE}${ruta}`, {
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    ...rest,
  });
  let cuerpo = null;
  try {
    cuerpo = await res.json();
  } catch {
    cuerpo = null;
  }
  return { res, cuerpo };
}

async function main() {
  await limpiarFixture();
  console.log(`[smoke] TopicGym · regresión end-to-end → ${BASE}\n`);

  // 1. Salud de la API y de la base de datos
  console.log('→ Salud');
  const salud = await pedir('/health');
  reportar('GET /health responde 200', salud.res.status === 200, `status=${salud.res.status}`);
  reportar(
    'GET /health · base de datos accesible',
    salud.cuerpo?.status === 'ok' && salud.cuerpo?.db === true,
    JSON.stringify(salud.cuerpo),
  );

  // 2. Autenticación
  console.log('\n→ Autenticación');
  const login = await pedir('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: EMAIL, password: PASSWORD }),
  });
  const setCookie = login.res.headers.get('set-cookie') || '';
  reportar('POST /auth/login responde 200', login.res.status === 200, `status=${login.res.status}`);
  reportar(
    'POST /auth/login · cookie httpOnly con JWT',
    /token=/.test(setCookie) && /HttpOnly/i.test(setCookie),
    setCookie.slice(0, 80),
  );

  const cookie = setCookie.split(';')[0];
  const authHeaders = { Cookie: cookie };

  const me = await pedir('/auth/me', { headers: authHeaders });
  reportar(
    'GET /auth/me · usuario autenticado',
    me.res.status === 200 && me.cuerpo?.usuario?.correo === EMAIL,
    `status=${me.res.status}`,
  );

  const sinSesion = await pedir('/progress');
  reportar(
    'GET /progress sin sesión → 401',
    sinSesion.res.status === 401,
    `status=${sinSesion.res.status}`,
  );

  // 3. Catálogo
  console.log('\n→ Catálogo');
  const semestres = await pedir('/semesters');
  reportar(
    'GET /semesters · 4 semestres, 1.º ACTIVO',
    semestres.res.status === 200 && semestres.cuerpo?.semestres?.length === 4 &&
      semestres.cuerpo.semestres.some((s) => s.numero === 1 && s.estado === 'ACTIVO'),
    `status=${semestres.res.status}`,
  );

  const asignaturas = await pedir('/semesters/1/subjects');
  reportar(
    'GET /semesters/1/subjects · incluye Lógica',
    asignaturas.cuerpo?.asignaturas?.some((a) => a.nombre === 'Lógica de Programación'),
    JSON.stringify(asignaturas.cuerpo),
  );

  const temas = await pedir('/subjects/1/topics');
  reportar(
    'GET /subjects/1/topics · 5 temas',
    temas.cuerpo?.temas?.length === 5,
    `temas=${temas.cuerpo?.temas?.length}`,
  );

  const detalleTema = await pedir('/topics/1');
  reportar(
    'GET /topics/1 · tema con videos de apoyo',
    detalleTema.res.status === 200 && (detalleTema.cuerpo?.tema?.videos?.length ?? 0) > 0,
    `status=${detalleTema.res.status}`,
  );

  // 4. Banco ampliado (Acta 06)
  console.log('\n→ Banco de ejercicios (15 ejercicios)');
  const banco = await pedir('/exercises?temaId=1', { headers: authHeaders });
  const ejerciciosTema1 = banco.cuerpo?.ejercicios || [];
  reportar(
    'GET /exercises?temaId=1 · 3 ejercicios (ampliado)',
    ejerciciosTema1.length === 3,
    `ejercicios=${ejerciciosTema1.length}`,
  );
  const conOpciones = ejerciciosTema1.every((e) => (e.opciones?.length ?? 0) === 4);
  reportar('Cada ejercicio expone 4 opciones', conOpciones, 'faltan opciones');
  const sinRespuesta =
    !JSON.stringify(ejerciciosTema1).includes('es_correcta') &&
    !JSON.stringify(ejerciciosTema1).includes('opcionCorrectaId');
  reportar('La respuesta correcta NO viaja al cliente', sinRespuesta, 'se filtró es_correcta');

  const filtro = await pedir('/exercises?temaId=1&nivel=DIFICIL', { headers: authHeaders });
  reportar(
    'Filtro por nivel=DIFICIL',
    (filtro.cuerpo?.ejercicios || []).every((e) => e.nivel === 'DIFICIL') &&
      filtro.cuerpo.ejercicios.length === 1,
    JSON.stringify(filtro.cuerpo?.ejercicios?.map((e) => e.nivel)),
  );

  // 5. Validación de respuestas y regla del primer intento
  console.log('\n→ Validación de respuestas');
  const correctaQuery = await pool.query(
    `SELECT o.id AS opcion_id, o.ejercicio_id
       FROM opciones o JOIN ejercicios e ON e.id = o.ejercicio_id
      WHERE e.orden = 1 AND o.es_correcta LIMIT 1`,
  );
  const correcta = correctaQuery.rows[0];
  const puntosEsperados = 10;

  const valOk = await pedir(`/exercises/${correcta.ejercicio_id}/validate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ opcionId: correcta.opcion_id }),
  });
  reportar(
    `POST validate (respuesta correcta) · correcta=true, ${puntosEsperados} pts`,
    valOk.res.status === 200 && valOk.cuerpo?.correcta === true && valOk.cuerpo?.puntos === puntosEsperados,
    JSON.stringify(valOk.cuerpo),
  );
  reportar(
    'Se devuelve la explicación de la respuesta',
    typeof valOk.cuerpo?.explicacion === 'string' && valOk.cuerpo.explicacion.length > 0,
    'sin explicación',
  );

  const valRepetida = await pedir(`/exercises/${correcta.ejercicio_id}/validate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ opcionId: correcta.opcion_id }),
  });
  reportar(
    'Repetir el mismo ejercicio NO suma puntos (primer intento)',
    valRepetida.cuerpo?.intento === 2 && valRepetida.cuerpo?.puntos === 0,
    JSON.stringify(valRepetida.cuerpo),
  );

  const opcionMala = await pool.query(
    `SELECT id FROM opciones WHERE ejercicio_id = $1 AND NOT es_correcta LIMIT 1`,
    [correcta.ejercicio_id],
  );
  const valMal = await pedir(`/exercises/${correcta.ejercicio_id}/validate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ opcionId: opcionMala.rows[0].id }),
  });
  reportar(
    'Respuesta incorrecta → correcta=false',
    valMal.cuerpo?.correcta === false,
    JSON.stringify(valMal.cuerpo),
  );

  // 6. Progreso, logros y estadísticas
  console.log('\n→ Progreso, logros y estadísticas');
  const progreso = await pedir('/progress', { headers: authHeaders });
  reportar(
    'GET /progress · registra avance en el tema',
    progreso.res.status === 200 && (progreso.cuerpo?.progreso?.length ?? 0) > 0,
    `status=${progreso.res.status}`,
  );

  const logros = await pedir('/achievements', { headers: authHeaders });
  const primerAcierto = (logros.cuerpo?.logros || []).find((l) => l.codigo === 'PRIMER_ACIERTO');
  reportar(
    'GET /achievements · PRIMER_ACIERTO obtenido',
    primerAcierto?.obtenido === true,
    JSON.stringify(logros.cuerpo),
  );

  const stats = await pedir('/stats', { headers: authHeaders });
  reportar(
    'GET /stats · puntos y racha calculados',
    stats.res.status === 200 && typeof stats.cuerpo?.stats?.puntos_totales === 'number',
    `status=${stats.res.status}`,
  );

  // 7. Validación de entrada (Zod) y rutas no encontradas
  console.log('\n→ Validación de entrada y errores');
  const invalida = await pedir('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: 'no-es-correo', password: '' }),
  });
  reportar(
    'Login con datos inválidos → 400 con detalles',
    invalida.res.status === 400 && Array.isArray(invalida.cuerpo?.detalles),
    JSON.stringify(invalida.cuerpo),
  );

  const noExiste = await pedir('/topics/9999');
  reportar('GET /topics/9999 → 404', noExiste.res.status === 404, `status=${noExiste.res.status}`);

  const sinOpcion = await pedir('/exercises/1/validate', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({}),
  });
  reportar(
    'Validación sin opción → 400',
    sinOpcion.res.status === 400,
    `status=${sinOpcion.res.status} · ${JSON.stringify(sinOpcion.cuerpo)}`,
  );

  // 8. Encabezados de rate limit (no se fuerza el 429 para no bloquear el entorno)
  console.log('\n→ Seguridad (rate limit y cabeceras)');
  const conLimite = salud.res.headers.get('ratelimit-policy') || salud.res.headers.get('ratelimit-limit');
  reportar(
    'Encabezados de rate limit presentes',
    /ratelimit/i.test(salud.res.headers.get('ratelimit-policy') || '') || !!conLimite,
    'sin encabezado de rate limit',
  );

  const origenPermitido = await fetch(`${BASE}/health`, { headers: { Origin: 'http://localhost:4200' } });
  const aclPermitido = origenPermitido.headers.get('access-control-allow-origin');
  reportar(
    'CORS · origen permitido (4200) recibe cabecera',
    aclPermitido === 'http://localhost:4200',
    `allow-origin=${aclPermitido}`,
  );

  const origenBloqueado = await fetch(`${BASE}/health`, { headers: { Origin: 'http://ejemplo-malicioso.dev' } });
  reportar(
    'CORS · origen no permitido es rechazado',
    !origenBloqueado.headers.get('access-control-allow-origin'),
    `allow-origin=${origenBloqueado.headers.get('access-control-allow-origin')}`,
  );

  // 9. Logout
  console.log('\n→ Cierre de sesión');
  const logout = await pedir('/auth/logout', {
    method: 'POST',
    headers: authHeaders,
  });
  reportar('POST /auth/logout responde 200', logout.res.status === 200 && logout.cuerpo?.ok === true, `status=${logout.res.status}`);

  await pool.end();

  // Resumen
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Resultado: ${pasaron} PASA · ${fallaron} FALLA`);
  if (fallos.length) {
    console.log('Fallos:');
    fallos.forEach((f) => console.log(`  - ${f}`));
  }
  console.log(`${'='.repeat(60)}`);
  process.exitCode = fallaron === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error('[smoke] Error inesperado:', err);
  process.exitCode = 1;
});