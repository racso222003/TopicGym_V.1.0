/**
 * Prueba del login con las cuentas demo sembradas por `npm run seed`.
 *   node backend/scripts/demo-login-test.js
 */
'use strict';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000/api';

const DEMO = [
  ['estudiante.demo@institucion.edu.co', 'TopicGym2026', 'ESTUDIANTE'],
  ['docente.demo@institucion.edu.co', 'TopicGym2026', 'DOCENTE'],
];

let pass = 0;
let fail = 0;

function log(ok, name, extra = '') {
  if (ok) { pass++; console.log(`  [OK]   ${name}${extra ? ' :: ' + extra : ''}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra ? ' :: ' + extra : ''}`); }
}

(async () => {
  console.log('\n=== PRUEBA: LOGIN CUENTAS DEMO ===\n');

  for (const [correo, password, rolEsperado] of DEMO) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
    });
    const data = await res.json().catch(() => null);
    const ok = res.status === 200 && data?.usuario?.rol === rolEsperado;
    log(ok, `Login ${correo}`, `status=${res.status} rol=${data?.usuario?.rol}`);
    log(data?.usuario?.email_verificado === true, `  email_verificado=true para ${rolEsperado}`);
  }

  // El docente debe poder usar el modulo docente
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'docente.demo@institucion.edu.co', password: 'TopicGym2026' }),
  });
  const setCookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const rCod = await fetch(`${BASE}/teachers/codes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: setCookie }, body: '{}',
  });
  const dCod = await rCod.json();
  log(rCod.status === 201 && !!dCod.codigo?.codigo, 'Docente demo genera codigo de clase', dCod.codigo?.codigo);

  const rProg = await fetch(`${BASE}/teachers/students-progress`, { headers: { Cookie: setCookie } });
  const dProg = await rProg.json();
  log(rProg.status === 200 && Array.isArray(dProg.alumnos), 'Docente demo consulta progreso', `n=${dProg.alumnos?.length}`);

  console.log(`\n=== RESULTADO: ${pass} OK / ${fail} FALLO ===\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
