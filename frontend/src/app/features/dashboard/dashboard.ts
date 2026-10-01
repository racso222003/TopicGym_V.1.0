import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProgresoService } from '../../core/services/progreso.service';
import { Logro, ProgresoTema, Stats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <h1>Hola, {{ primerNombre() }}</h1>
      <p>Este es el resumen de tu avance en Lógica de Programación.</p>
    </div>

    @if (cargando()) {
      <div class="spinner"></div>
    } @else if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    } @else if (stats(); as s) {
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value">{{ s.puntos_totales }}</div>
          <div class="kpi-label">Puntos totales</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ s.aciertos }}</div>
          <div class="kpi-label">Aciertos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ s.racha_actual }}</div>
          <div class="kpi-label">Racha actual (días)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ s.racha_maxima }}</div>
          <div class="kpi-label">Racha máxima</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ s.intentos }}</div>
          <div class="kpi-label">Intentos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">{{ s.dias_activos }}</div>
          <div class="kpi-label">Días activos</div>
        </div>
      </div>

      <div class="grid-cards" style="margin-top: 22px; align-items: start">
        <div class="card">
          <div class="card-head">
            <span>Mi progreso por tema</span>
            <a routerLink="/progreso" class="small">Ver todo</a>
          </div>
          <div class="card-body">
            @if (progreso().length === 0) {
              <p class="muted small">
                Aún no has resuelto ejercicios.
                <a routerLink="/catalogo">Explora el catálogo</a> para empezar.
              </p>
            } @else {
              <div class="stack">
                @for (p of progreso(); track p.tema_id) {
                  <div>
                    <div class="spread small">
                      <strong>{{ p.tema }}</strong>
                      <span class="muted">{{ p.puntos }} pts · {{ p.ejercicios_resueltos }} resueltos</span>
                    </div>
                    <div class="progress-track" style="margin-top: 6px">
                      <div class="progress-fill" [style.width.%]="anchoProgreso(p)"></div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <span>Logros</span>
            <a routerLink="/logros" class="small">Ver todos</a>
          </div>
          <div class="card-body">
            <div class="kpi-value">{{ logrosObtenidos() }} / {{ logros().length }}</div>
            <div class="kpi-label">Logros obtenidos</div>
            @if (logrosObtenidos() === 0) {
              <p class="muted small" style="margin-top: 12px">
                Responde tu primer ejercicio correcto para desbloquear un logro.
              </p>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class Dashboard implements OnInit {
  private readonly progresoService = inject(ProgresoService);
  private readonly auth = inject(AuthService);

  readonly stats = signal<Stats | null>(null);
  readonly progreso = signal<ProgresoTema[]>([]);
  readonly logros = signal<Logro[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly primerNombre = computed(() => (this.auth.usuario()?.nombre ?? 'estudiante').split(' ')[0]);
  readonly logrosObtenidos = computed(() => this.logros().filter((l) => l.obtenido).length);

  ngOnInit(): void {
    forkJoin({
      stats: this.progresoService.stats(),
      progreso: this.progresoService.progreso(),
      logros: this.progresoService.logros(),
    }).subscribe({
      next: ({ stats, progreso, logros }) => {
        this.stats.set(stats);
        this.progreso.set(progreso);
        this.logros.set(logros);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudieron cargar los datos.');
        this.cargando.set(false);
      },
    });
  }

  anchoProgreso(p: ProgresoTema): number {
    return Math.min(100, p.ejercicios_resueltos * 20);
  }
}
