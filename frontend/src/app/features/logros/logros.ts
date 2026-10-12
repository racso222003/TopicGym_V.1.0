import { Component, OnInit, inject, signal } from '@angular/core';
import { ProgresoService } from '../../core/services/progreso.service';
import { Logro } from '../../core/models';

@Component({
  selector: 'app-logros',
  templateUrl: './logros.html',
  styleUrl: './logros.css',
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
