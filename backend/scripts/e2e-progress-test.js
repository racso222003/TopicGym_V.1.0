/**
 * Prueba del flujo completo con progreso real de estudiante:
 * docente genera codigo -> estudiante se registra y resuelve ejercicios ->
 * docente ve el progreso agregado (ejercicios, puntos, logros).
 *
 *   node backend/scripts/e2e-progress-test.js
 */
'use strict';

const { Pool } = require('pg');
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000/api';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '12345',
  database: 'topicgym',
});

let cookie = '';
let pass = 0;
let fail = 0;

function log(ok, name, extra = '') {
  if (ok) { pass++; console.log(`  [OK]   ${name}${extra ? ' :: ' + extra : ''}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra ? ' :: ' + extra : ''}`); }
}

async function call(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (sc.length) cookie = sc.map((c) => c.split(';')[0]).join('; ');
  let data = null;
  try { data = await res.json(); } catch (_e) {}
  return { status: res.status, data };
}

const uniq = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

(async () => {
  console.log('\n=== PRUEBA E2E: PROGRESO REAL DE ESTUDIANTE ===\n');

  const correoDoc = `${uniq('pdoc')}@institucion.edu.co`;
  const correoEst = `${uniq('pest')}@institucion.edu.co`;

  // 1. Docente se registra
  await call('POST', '/auth/register', {
    nombre: 'Doc Progreso', correo: correoDoc, password: 'Password123', rol: 'DOCENTE',
  });
  let q = await pool.query('SELECT token_verificacion FROM usuarios WHERE correo_institucional=$1', [correoDoc]);
  await call('GET', `/auth/verify/${q.rows[0].token_verificacion}`);

  // 2. Login docente + generar codigo
  await call('POST', '/auth/login', { correo: correoDoc, password: 'Password123' });
  const rCod = await call('POST', '/teachers/codes', {});
  const codigo = rCod.data.codigo.codigo;
  log(true, 'Codigo generado', codigo);

  // 3. Estudiante se registra con el codigo
  await call('POST', '/auth/register', {
    nombre: 'Estudiante Progreso', correo: correoEst, password: 'Password123',
    rol: 'ESTUDIANTE', codigoClase: codigo,
  });
  q = await pool.query('SELECT token_verificacion FROM usuarios WHERE correo_institucional=$1', [correoEst]);
  await call('GET', `/auth/verify/${q.rows[0].token_verificacion}`);

  // 4. Login estudiante
  cookie = '';
  await call('POST', '/auth/login', { correo: correoEst, password: 'Password123' });

  // 5. Obtener ejercicios y resolver
  const rSem = await call('GET', '/semesters');
  const semestre = rSem.data?.[0] || rSem.data?.semestres?.[0];
  const rAsig = await call('GET', `/semesters/${semestre.id}/subjects`);
  const asignatura = rAsig.data?.[0] || rAsig.data?.asignaturas?.[0];
  const rTemas = await call('GET', `/subjects/${asignatura.id}/topics`);
  const temas = rTemas.data?.temas || rTemas.data || [];
  const tema = temas[0];
  log(!!tema, 'Tema obtenido para resolver', tema?.titulo);

  const rEj = await call('GET', `/exercises?temaId=${tema.id}`);
  const ejercicios = rEj.data?.ejercicios || rEj.data || [];
  log(ejercicios.length > 0, 'Ejercicios disponibles', `n=${ejercicios.length}`);

  let resueltos = 0;
  let puntos = 0;
  for (const ej of ejercicios.slice(0, 5)) {
    // La opcion correcta NO se expone por la API (segun diseno de seguridad).
    // El test la consulta directo en la BD, como haria un instructor.
    const qc = await pool.query(
      'SELECT id FROM opciones WHERE ejercicio_id = $1 AND es_correcta = TRUE LIMIT 1',
      [ej.id],
    );
    const opcionCorrecta = qc.rows[0];
    if (!opcionCorrecta) continue;
    const rVal = await call('POST', `/exercises/${ej.id}/validate`, { opcionId: opcionCorrecta.id });
    if (rVal.status === 200) {
      resueltos++;
      puntos += rVal.data?.puntos || 0;
    } else {
      log(false, `Validar ejercicio ${ej.id}`, `status=${rVal.status} ${JSON.stringify(rVal.data)}`);
    }
  }
  log(resueltos > 0, 'Ejercicios resueltos por el estudiante', `${resueltos} resueltos, ${puntos} puntos`);

  // El progreso del propio estudiante debe reflejar lo mismo
  const rProgEst = await call('GET', '/progress');
  const prog = rProgEst.data?.progreso || [];
  const totalEst = prog.reduce((a, p) => a + Number(p.ejercicios_resueltos || 0), 0);
  const ptsEst = prog.reduce((a, p) => a + Number(p.puntos || 0), 0);
  log(totalEst === resueltos, 'GET /progress coincide con lo resuelto', `${totalEst} vs ${resueltos}`);
  log(ptsEst === puntos, 'Puntos en /progress coinciden', `${ptsEst} vs ${puntos}`);

  // Logros del estudiante
  const rLogros = await call('GET', '/achievements');
  const obt = (rLogros.data?.logros || []).filter((l) => l.obtenido);
  log(obt.length > 0, 'Estudiante obtuvo logros', obt.map((l) => l.codigo).join(','));

  // 6. El docente ve el progreso
  cookie = '';
  await call('POST', '/auth/login', { correo: correoDoc, password: 'Password123' });
  const rProg = await call('GET', '/teachers/students-progress');
  const alumno = rProg.data?.alumnos?.find((a) => a.correo === correoEst);

  log(!!alumno, 'Alumno listado para el docente');
  log(alumno?.ejercicios_resueltos === resueltos, 'ejercicios_resueltos coincide', `${alumno?.ejercicios_resueltos} vs ${resueltos}`);
  log(alumno?.puntos_totales === puntos, 'puntos_totales coincide', `${alumno?.puntos_totales} vs ${puntos}`);
  log(typeof alumno?.ejercicios_resueltos === 'number', 'Tipo numerico (no string)');
  log(Array.isArray(alumno?.logros), 'logros es arreglo', `n=${alumno?.logros?.length}`);
  log(alumno?.codigo_usado === codigo, 'codigo_usado correcto', alumno?.codigo_usado);

  // 7. Aislamiento: otro docente no ve al alumno
  const correoDoc2 = `${uniq('pdoc2')}@institucion.edu.co`;
  await call('POST', '/auth/register', {
    nombre: 'Doc Isolado', correo: correoDoc2, password: 'Password123', rol: 'DOCENTE',
  });
  q = await pool.query('SELECT token_verificacion FROM usuarios WHERE correo_institucional=$1', [correoDoc2]);
  await call('GET', `/auth/verify/${q.rows[0].token_verificacion}`);
  cookie = '';
  await call('POST', '/auth/login', { correo: correoDoc2, password: 'Password123' });
  const rAisla = await call('GET', '/teachers/students-progress');
  const veAlumno = rAisla.data?.alumnos?.some((a) => a.correo === correoEst);
  log(!veAlumno, 'Aislamiento: otro docente NO ve al alumno');

  // 8. Limpieza
  await pool.query('DELETE FROM usuarios WHERE correo_institucional IN ($1,$2,$3)', [correoDoc, correoEst, correoDoc2]);
  console.log('\n[cleanup] datos de prueba eliminados');

  await pool.end();
  console.log(`\n=== RESULTADO: ${pass} OK / ${fail} FALLO ===\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('ERROR FATAL:', e); process.exit(1); });
