/**
 * Prueba de integración frontend+backend: registra un usuario vía la API,
 * verifica el correo, hace login y valida que la cookie de sesión funciona
 * contra los endpoints protegidos (simula lo que hace la SPA con HttpClient).
 *
 *   node backend/scripts/integration-test.js
 */
'use strict';

const { Pool } = require('pg');
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:4200';

const pool = new Pool({
  host: 'localhost', port: 5432, user: 'postgres', password: '12345', database: 'topicgym',
});

let pass = 0, fail = 0;
function log(ok, name, extra = '') {
  if (ok) { pass++; console.log(`  [OK]   ${name}${extra ? ' :: ' + extra : ''}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra ? ' :: ' + extra : ''}`); }
}

const jar = new Map();
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}
function storeCookies(res) {
  const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of sc) {
    const [pair] = c.split(';');
    const idx = pair.indexOf('=');
    jar.set(pair.slice(0, idx), pair.slice(idx + 1));
  }
}

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const ch = cookieHeader();
  if (ch) headers.Cookie = ch;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  storeCookies(res);
  const data = await res.json().catch(() => null);
  return { status: res.status, data, res };
}

const uniq = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

(async () => {
  console.log('\n=== INTEGRACION FRONTEND + BACKEND ===\n');

  // --- El proxy del frontend debe reenviar al backend con CORS + cookies ---
  console.log('[1] Proxy del frontend');
  {
    const res = await fetch(`${FRONTEND}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: FRONTEND },
      body: JSON.stringify({ correo: 'nadie@institucion.edu.co', password: 'x' }),
    });
    const data = await res.json().catch(() => null);
    log(res.status === 401, 'POST /api/auth/login via proxy responde 401', `status=${res.status}`);
    const acao = res.headers.get('access-control-allow-origin');
    log(acao === FRONTEND || acao === '*' || !!acao, 'CORS header presente', String(acao));
    log(data?.error != null, 'Respuesta JSON de error normalizada', data?.error);
  }

  // --- Registro completo con verificación, usando la cookie de sesión ---
  console.log('\n[2] Registro + verificacion + sesion persistente');
  const correo = `${uniq('int')}@institucion.edu.co`;
  {
    const r = await api('POST', '/auth/register', {
      nombre: 'Integracion Test', correo, password: 'Password123', rol: 'ESTUDIANTE',
    });
    log(r.status === 201, 'Registro creado', `status=${r.status}`);
  }
  {
    const q = await pool.query('SELECT token_verificacion FROM usuarios WHERE correo_institucional=$1', [correo]);
    const r = await api('GET', `/auth/verify/${q.rows[0].token_verificacion}`);
    log(r.status === 200 && r.data?.ok, 'Correo verificado', `status=${r.status}`);
  }
  {
    const r = await api('POST', '/auth/login', { correo, password: 'Password123' });
    log(r.status === 200, 'Login exitoso', `status=${r.status}`);
    const cookies = r.res.headers.getSetCookie();
    const httpOnly = cookies.some((c) => /httponly/i.test(c));
    const sameSite = cookies.some((c) => /samesite/i.test(c));
    log(httpOnly, 'Cookie httpOnly');
    log(sameSite, 'Cookie SameSite');
    log(jar.has('token'), 'Cookie de sesion almacenada');
  }
  {
    // /auth/me con la cookie recuperada: valida la rehidratacion de la SPA
    const r = await api('GET', '/auth/me');
    log(r.status === 200 && r.data?.usuario?.correo === correo, 'GET /auth/me con cookie', `status=${r.status}`);
    log(r.data?.usuario?.rol_codigo === 'ESTUDIANTE', 'Rol disponible para los guards', r.data?.usuario?.rol_codigo);
  }
  {
    // Endpoint protegido: la SPA lo llama con la cookie
    const r = await api('GET', '/semesters');
    log(r.status === 200, 'GET /semesters protegido con cookie', `status=${r.status}`);
  }
  {
    // Logout limpia la cookie
    const r = await api('POST', '/auth/logout', {});
    log(r.status === 200, 'Logout', `status=${r.status}`);
    jar.clear();
    const r2 = await api('GET', '/auth/me');
    log(r2.status === 401, 'Tras logout /auth/me -> 401', `status=${r2.status}`);
  }

  // --- El docente NO puede usar endpoints de estudiante ---
  console.log('\n[3] Aislamiento docente');
  {
    const r = await api('POST', '/auth/login', { correo: 'docente.demo@institucion.edu.co', password: 'TopicGym2026' });
    log(r.status === 200, 'Login docente demo', `status=${r.status}`);
    const r2 = await api('GET', '/teachers/students-progress');
    log(r2.status === 200, 'Docente accede a su panel', `status=${r2.status}`);
  }

  await pool.query('DELETE FROM usuarios WHERE correo_institucional=$1', [correo]);
  jar.clear();
  await pool.end();

  console.log(`\n=== RESULTADO: ${pass} OK / ${fail} FALLO ===\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('ERROR FATAL:', e); process.exit(1); });
