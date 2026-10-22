/**
 * Verifica que el frontend serve las rutas del flujo de auth y docente.
 *   node backend/scripts/frontend-routes-test.js
 */
'use strict';

const BASE = process.env.FRONTEND_URL || 'http://localhost:4200';

const rutas = [
  ['/', 'Raiz'],
  ['/login', 'Login'],
  ['/registro', 'Registro'],
  ['/teacher-dashboard', 'Teacher Dashboard'],
  ['/catalogo', 'Catalogo'],
  ['/dashboard', 'Dashboard'],
];

let pass = 0;
let fail = 0;

(async () => {
  console.log('\n=== PRUEBAS FRONTEND (servidor de desarrollo) ===\n');
  for (const [ruta, nombre] of rutas) {
    try {
      const res = await fetch(`${BASE}${ruta}`, { redirect: 'follow' });
      const html = await res.text();
      const tieneApp = html.includes('<app-root');
      const ok = res.status === 200 && tieneApp;
      if (ok) { pass++; console.log(`  [OK]   ${ruta} (${nombre}) :: status=${res.status}`); }
      else { fail++; console.log(`  [FAIL] ${ruta} (${nombre}) :: status=${res.status} app-root=${tieneApp}`); }
    } catch (e) {
      fail++;
      console.log(`  [FAIL] ${ruta} (${nombre}) :: ${e.message}`);
    }
  }

  // El proxy del frontend debe reenviar /api al backend
  try {
    const res = await fetch(`${BASE}/api/health`);
    const data = await res.json();
    const ok = res.status === 200 && data.status === 'ok';
    if (ok) { pass++; console.log(`  [OK]   /api/health via proxy :: status=${res.status}`); }
    else { fail++; console.log(`  [FAIL] /api/health via proxy :: status=${res.status} ${JSON.stringify(data)}`); }
  } catch (e) {
    fail++;
    console.log(`  [FAIL] /api/health via proxy :: ${e.message}`);
  }

  // Los bundles de las features nuevas deben existir (lazy chunks del build)
  try {
    const fs = require('fs');
    const path = require('path');
    const dist = path.resolve(__dirname, '..', '..', 'frontend', 'dist', 'frontend', 'browser');
    if (!fs.existsSync(dist)) {
      fail++;
      console.log(`  [FAIL] No existe el build en ${dist} (ejecuta "npm run build" en frontend)`);
    } else {
      const archivos = fs.readdirSync(dist).filter((f) => f.endsWith('.js'));
      const contenido = archivos.map((f) => fs.readFileSync(path.join(dist, f), 'utf8')).join('\n');
      const checks = [
        ['teacher-dashboard (lazy chunk)', /teacher-dashboard/],
        ['registro (lazy chunk)', /registro/],
        ['endpoint teachers/codes', /teachers\/codes/],
        ['endpoint students-progress', /students-progress/],
        ['ruta /teacher-dashboard', /teacher-dashboard/],
        ['ruta /registro', /registro/],
        ['texto "Codigo de Clase"', /[Cc][oó]digo de [Cc]lase/],
        ['campo codigoClase', /codigoClase/],
        ['tabla de alumnos (data-grid)', /data-grid/],
        ['columna ejercicios resueltos', /[Ee]jercicios [Rr]esueltos/],
        ['columna puntos totales', /[Pp]untos [Tt]otales/],
        ['ultimos logros', /[ÚU]ltimos [Ll]ogros/],
      ];
      for (const [nombre, re] of checks) {
        const ok = re.test(contenido);
        if (ok) { pass++; console.log(`  [OK]   Build contiene ${nombre}`); }
        else { fail++; console.log(`  [FAIL] Build NO contiene ${nombre}`); }
      }
    }
  } catch (e) {
    fail++;
    console.log(`  [FAIL] Inspección de bundles :: ${e.message}`);
  }

  console.log(`\n=== RESULTADO: ${pass} OK / ${fail} FALLO ===\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
