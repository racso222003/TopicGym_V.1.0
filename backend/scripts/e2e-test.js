/**
 * Pruebas E2E del flujo: registro -> verificacion -> login -> modulo docente.
 * Ejecutar con el backend levantado en http://localhost:3000
 *   node backend/scripts/e2e-test.js
 */
'use strict';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000/api';

let cookie = '';
let pass = 0;
let fail = 0;

function log(ok, name, extra = '') {
  if (ok) {
    pass++;
    console.log(`  [OK]   ${name}${extra ? ' :: ' + extra : ''}`);
  } else {
    fail++;
    console.log(`  [FAIL] ${name}${extra ? ' :: ' + extra : ''}`);
  }
}

async function call(method, path, body, withCookie = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (withCookie && cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (setCookie && setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = null;
  }
  return { status: res.status, data };
}

function unique(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

(async () => {
  console.log('\n=== PRUEBAS E2E TopicGym ===\n');

  // ---------------------------------------------------------
  console.log('[1] Health check');
  {
    const r = await call('GET', '/health', null, false);
    log(r.status === 200 && r.data?.status === 'ok', 'GET /health', `status=${r.status}`);
  }

  // ---------------------------------------------------------
  console.log('\n[2] Validacion Zod en registro');
  {
    const r = await call('POST', '/auth/register', { nombre: 'X', correo: 'no-email', password: '123' });
    log(r.status === 400, 'Registro invalido -> 400', `status=${r.status} ${JSON.stringify(r.data)}`);
  }
  {
    const r = await call('POST', '/auth/register', {
      nombre: 'Rol Invalido',
      correo: `${unique('rol')}@institucion.edu.co`,
      password: 'Password123',
      rol: 'ADMIN',
    });
    log(r.status === 400, 'Rol fuera de enum -> 400', `status=${r.status}`);
  }
  {
    const r = await call('POST', '/auth/register', {
      nombre: 'Pass Corta',
      correo: `${unique('pass')}@institucion.edu.co`,
      password: 'corta',
      rol: 'ESTUDIANTE',
    });
    log(r.status === 400, 'Password < 8 chars -> 400', `status=${r.status}`);
  }

  // ---------------------------------------------------------
  console.log('\n[3] Registro de docente');
  const correoDocente = `${unique('docente')}@institucion.edu.co`;
  let tokenDocente = null;
  {
    const r = await call('POST', '/auth/register', {
      nombre: 'Docente Prueba',
      correo: correoDocente,
      password: 'Password123',
      rol: 'DOCENTE',
    });
    log(r.status === 201 && r.data?.ok === true, 'POST /auth/register (DOCENTE)', `status=${r.status}`);
    log(r.data?.usuario?.email_verificado === false, 'Usuario inicia con email_verificado=false');
  }

  // ---------------------------------------------------------
  console.log('\n[4] Login bloqueado antes de verificar');
  {
    const r = await call('POST', '/auth/login', { correo: correoDocente, password: 'Password123' });
    log(r.status === 403, 'Login sin verificar -> 403', `status=${r.status} ${JSON.stringify(r.data)}`);
  }

  // ---------------------------------------------------------
  console.log('\n[5] Verificacion de correo (token desde BD)');
  const { Pool } = require('pg');
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '12345',
    database: 'topicgym',
  });
  let token = null;
  {
    const q = await pool.query('SELECT token_verificacion FROM usuarios WHERE correo_institucional = $1', [correoDocente]);
    token = q.rows[0]?.token_verificacion;
    log(!!token, 'Token de verificacion generado en BD');
  }
  {
    const r = await call('GET', `/auth/verify/${token}`, null, false);
    log(r.status === 200 && r.data?.ok === true, 'GET /auth/verify/:token', `status=${r.status}`);
  }
  {
    const r = await call('GET', `/auth/verify/${token}`, null, false);
    log(r.status === 400, 'Reutilizar token -> 400', `status=${r.status}`);
  }

  // ---------------------------------------------------------
  console.log('\n[6] Login de docente verificado');
  {
    const r = await call('POST', '/auth/login', { correo: correoDocente, password: 'Password123' });
    log(r.status === 200 && !!r.data?.token, 'POST /auth/login (DOCENTE)', `status=${r.status}`);
    log(r.data?.usuario?.rol === 'DOCENTE', 'Rol devuelto en respuesta', r.data?.usuario?.rol);
    log(r.data?.usuario?.rol_id != null, 'rol_id devuelto en respuesta', String(r.data?.usuario?.rol_id));
    log(!!cookie, 'Cookie httpOnly ' + 'set' );
  }

  // ---------------------------------------------------------
  console.log('\n[7] Endpoints docente');
  let codigo = null;
  {
    const r = await call('POST', '/teachers/codes', {});
    log(r.status === 201 && !!r.data?.codigo?.codigo, 'POST /teachers/codes', `status=${r.status}`);
    codigo = r.data?.codigo?.codigo;
    log(/^PROG-/.test(codigo || ''), 'Formato de codigo PROG-XXXXXX', codigo);
  }
  {
    const r = await call('GET', '/teachers/codes');
    log(r.status === 200 && Array.isArray(r.data?.codigos) && r.data.codigos.length >= 1, 'GET /teachers/codes', `status=${r.status} n=${r.data?.codigos?.length}`);
  }
  {
    const r = await call('GET', '/teachers/students-progress');
    log(r.status === 200 && Array.isArray(r.data?.alumnos), 'GET /teachers/students-progress', `status=${r.status}`);
  }

  // ---------------------------------------------------------
  console.log('\n[8] Registro de estudiante con codigo de clase');
  const correoEstudiante = `${unique('estudiante')}@institucion.edu.co`;
  {
    const r = await call('POST', '/auth/register', {
      nombre: 'Estudiante Prueba',
      correo: correoEstudiante,
      password: 'Password123',
      rol: 'ESTUDIANTE',
      codigoClase: codigo,
    });
    log(r.status === 201 && r.data?.ok === true, 'POST /auth/register (ESTUDIANTE + codigo)', `status=${r.status}`);
  }
  {
    const q = await pool.query(
      `SELECT cc.codigo FROM estudiantes_docentes ed JOIN codigos_clase cc ON cc.id = ed.codigo_id
       WHERE ed.estudiante_id = (SELECT id FROM usuarios WHERE correo_institucional = $1)`,
      [correoEstudiante],
    );
    log(q.rows.length === 1 && q.rows[0].codigo === codigo, 'Estudiante vinculado al codigo del docente', q.rows[0]?.codigo);
  }

  // ---------------------------------------------------------
  console.log('\n[9] Verificar + login estudiante');
  {
    const q = await pool.query('SELECT token_verificacion FROM usuarios WHERE correo_institucional = $1', [correoEstudiante]);
    await call('GET', `/auth/verify/${q.rows[0]?.token_verificacion}`, null, false);
    const r = await call('POST', '/auth/login', { correo: correoEstudiante, password: 'Password123' });
    log(r.status === 200 && r.data?.usuario?.rol === 'ESTUDIANTE', 'Login estudiante verificado', `status=${r.status}`);
  }

  // ---------------------------------------------------------
  console.log('\n[10] Progreso del alumno visible para el docente');
  {
    // login docente de nuevo (la cookie ahora es del estudiante)
    cookie = '';
    await call('POST', '/auth/login', { correo: correoDocente, password: 'Password123' });
    const r = await call('GET', '/teachers/students-progress');
    const alumno = r.data?.alumnos?.find((a) => a.correo === correoEstudiante);
    log(!!alumno, 'Alumno aparece en students-progress');
    log(alumno?.codigo_usado === codigo, 'codigo_usado correcto', alumno?.codigo_usado);
    log(typeof alumno?.ejercicios_resueltos === 'number', 'ejercicios_resueltos numerico', String(alumno?.ejercicios_resueltos));
    log(typeof alumno?.puntos_totales === 'number', 'puntos_totales numerico', String(alumno?.puntos_totales));
    log(Array.isArray(alumno?.logros), 'logros es arreglo', JSON.stringify(alumno?.logros));
  }

  // ---------------------------------------------------------
  console.log('\n[11] Control de acceso por rol');
  {
    cookie = '';
    await call('POST', '/auth/login', { correo: correoEstudiante, password: 'Password123' });
    const r = await call('POST', '/teachers/codes', {});
    log(r.status === 403, 'Estudiante en POST /teachers/codes -> 403', `status=${r.status}`);
    const r2 = await call('GET', '/teachers/students-progress');
    log(r2.status === 403, 'Estudiante en GET /teachers/students-progress -> 403', `status=${r2.status}`);
  }
  {
    cookie = '';
    const r = await call('GET', '/teachers/codes');
    log(r.status === 401, 'Sin token -> 401', `status=${r.status}`);
  }
  {
    cookie = '';
    await call('POST', '/auth/login', { correo: correoDocente, password: 'Password123' });
    const r = await call('POST', '/auth/login', { correo: correoDocente, password: 'Password123' });
    log(r.status === 200, 'Login repetido docente OK (rate limit ok)', `status=${r.status}`);
  }

  // ---------------------------------------------------------
  console.log('\n[12] Registro duplicado');
  {
    const r = await call('POST', '/auth/register', {
      nombre: 'Duplicado',
      correo: correoEstudiante,
      password: 'Password123',
      rol: 'ESTUDIANTE',
    });
    log(r.status === 409, 'Correo duplicado -> 409', `status=${r.status}`);
  }

  // ---------------------------------------------------------
  console.log('\n[13] Limpieza de datos de prueba');
  {
    const q = await pool.query('DELETE FROM usuarios WHERE correo_institucional IN ($1, $2)', [correoDocente, correoEstudiante]);
    log(q.rowCount === 2, 'Usuarios de prueba eliminados', `rowCount=${q.rowCount}`);
  }

  await pool.end();

  console.log(`\n=== RESULTADO: ${pass} OK / ${fail} FALLO ===\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('ERROR FATAL:', e);
  process.exit(1);
});
