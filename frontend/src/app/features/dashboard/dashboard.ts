import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProgresoService } from '../../core/services/progreso.service';
import { Logro, ProgresoTema, Stats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
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
