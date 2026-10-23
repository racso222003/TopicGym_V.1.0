import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoService } from '../../core/services/catalogo.service';
import { Asignatura, Semestre, TemaResumen } from '../../core/models';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit {
  private readonly service = inject(CatalogoService);
  private readonly router = inject(Router);

  readonly semestres = signal<Semestre[]>([]);
  readonly asignaturas = signal<Asignatura[]>([]);
  readonly temas = signal<TemaResumen[]>([]);
  readonly semestreSel = signal<Semestre | null>(null);
  readonly asignaturaSel = signal<Asignatura | null>(null);
  readonly cargando = signal(true);
  readonly cargandoHijos = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.service.semestres().subscribe({
      next: (semestres) => {
        this.semestres.set(semestres);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo cargar el catálogo.');
        this.cargando.set(false);
      },
    });
  }

  elegirSemestre(s: Semestre): void {
    if (s.estado !== 'ACTIVO') return;
    this.semestreSel.set(s);
    this.asignaturaSel.set(null);
    this.temas.set([]);
    this.error.set(null);
    this.cargandoHijos.set(true);
    this.service.asignaturas(s.id).subscribe({
      next: (asignaturas) => {
        this.asignaturas.set(asignaturas);
        this.cargandoHijos.set(false);
      },
      error: (err) => {
        this.cargandoHijos.set(false);
        this.error.set(err?.error?.error ?? 'No se pudieron cargar las asignaturas.');
      },
    });
  }

  elegirAsignatura(a: Asignatura): void {
    this.asignaturaSel.set(a);
    this.error.set(null);
    if (a.tiene_contenido === false) {
      this.temas.set([]);
      this.cargandoHijos.set(false);
      return;
    }
    this.cargandoHijos.set(true);
    this.service.temas(a.id).subscribe({
      next: (temas) => {
        this.temas.set(temas);
        this.cargandoHijos.set(false);
      },
      error: (err) => {
        this.cargandoHijos.set(false);
        this.error.set(err?.error?.error ?? 'No se pudieron cargar los temas.');
      },
    });
  }

  abrirTema(t: TemaResumen): void {
    this.router.navigate(['/tema', t.id]);
  }
}
