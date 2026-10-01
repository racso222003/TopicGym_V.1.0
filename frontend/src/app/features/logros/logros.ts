import { Component, OnInit, inject, signal } from '@angular/core';
import { ProgresoService } from '../../core/services/progreso.service';
import { Logro } from '../../core/models';

@Component({
  selector: 'app-logros',
  template: `
    <div class="page-head">
      <h1>Logros</h1>
      <p>Desbloquea insignias resolviendo ejercicios correctamente.</p>
    </div>

    @if (cargando()) {
      <div class="spinner"></div>
    } @else if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    } @else {
      <div class="grid-cards">
        @for (l of logros(); track l.id) {
          <div class="achievement" [class.locked]="!l.obtenido">
            <div class="achievement-medal">{{ l.obtenido ? '★' : '☆' }}</div>
            <div>
              <div class="spread">
                <strong>{{ l.nombre }}</strong>
                <span class="badge badge-active">{{ l.puntos }} pts</span>
              </div>
              <p class="small muted" style="margin: 6px 0 0">{{ l.descripcion }}</p>
              @if (l.obtenido) {
                <div class="small" style="color: var(--ok); margin-top: 6px">Obtenido</div>
              } @else {
                <div class="small muted" style="margin-top: 6px">Bloqueado</div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class Logros implements OnInit {
  private readonly progresoService = inject(ProgresoService);

  readonly logros = signal<Logro[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.progresoService.logros().subscribe({
      next: (logros) => {
        this.logros.set(logros);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudieron cargar los logros.');
        this.cargando.set(false);
      },
    });
  }
}
