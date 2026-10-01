import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProgresoService } from '../../core/services/progreso.service';
import { ProgresoTema, Stats } from '../../core/models';

@Component({
  selector: 'app-progreso',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <h1>Mi progreso</h1>
      <p>Resumen de puntos y temas trabajados.</p>
    </div>

    @if (cargando()) {
      <div class="spinner"></div>
    } @else if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    } @else {
      @if (stats(); as s) {
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
            <div class="kpi-label">Racha actual</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">{{ s.racha_maxima }}</div>
            <div class="kpi-label">Racha máxima</div>
          </div>
        </div>
      }

      <div class="card" style="margin-top: 20px">
        <div class="card-head">Detalle por tema</div>
        <div class="card-body">
          @if (progreso().length === 0) {
            <div class="empty">
              Aún no registras progreso. <a routerLink="/catalogo">Explora el catálogo</a>.
            </div>
          } @else {
            <div class="stack">
              @for (p of progreso(); track p.tema_id) {
                <div>
                  <div class="spread">
                    <strong>{{ p.tema }}</strong>
                    <span class="muted small">
                      {{ p.puntos }} pts · {{ p.ejercicios_resueltos }} ejercicios resueltos
                    </span>
                  </div>
                  <div class="progress-track" style="margin-top: 6px">
                    <div class="progress-fill" [style.width.%]="Math.min(100, p.ejercicios_resueltos * 20)"></div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class Progreso implements OnInit {
  private readonly progresoService = inject(ProgresoService);

  readonly stats = signal<Stats | null>(null);
  readonly progreso = signal<ProgresoTema[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  protected readonly Math = Math;

  ngOnInit(): void {
    forkJoin({
      stats: this.progresoService.stats(),
      progreso: this.progresoService.progreso(),
    }).subscribe({
      next: ({ stats, progreso }) => {
        this.stats.set(stats);
        this.progreso.set(progreso);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo cargar el progreso.');
        this.cargando.set(false);
      },
    });
  }
}
