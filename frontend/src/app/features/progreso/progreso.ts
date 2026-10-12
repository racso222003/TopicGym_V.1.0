import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProgresoService } from '../../core/services/progreso.service';
import { ProgresoTema, Stats } from '../../core/models';

@Component({
  selector: 'app-progreso',
  imports: [RouterLink],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css',
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
