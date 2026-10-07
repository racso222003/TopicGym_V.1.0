import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoService } from '../../core/services/catalogo.service';
import { Asignatura, Semestre, TemaResumen } from '../../core/models';

@Component({
  selector: 'app-catalogo',
  template: `
    <div class="page-head">
      <h1>Catálogo</h1>
      <p>Explora por semestre, asignatura y tema.</p>
    </div>

    @if (cargando()) {
      <div class="spinner"></div>
    } @else if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    } @else {
      <div class="grid-cards" style="align-items: start">
        <div class="card">
          <div class="card-head">Semestres</div>
          <div class="card-body stack">
            @for (s of semestres(); track s.id) {
              <button
                class="select-row"
                type="button"
                [class.selected]="semestreSel()?.id === s.id"
                (click)="elegirSemestre(s)"
              >
                <span>
                  <strong>{{ s.nombre }}</strong>
                  <span class="badge badge-active">{{ s.estado }}</span>
                </span>
                <span class="chevron">›</span>
              </button>
            }
          </div>
        </div>

        @if (semestreSel()) {
          <div class="card">
            <div class="card-head">Asignaturas</div>
            <div class="card-body stack">
              @if (cargandoHijos()) {
                <div class="spinner"></div>
              } @else if (asignaturas().length === 0) {
                <p class="muted small">Sin asignaturas registradas.</p>
              } @else {
                @for (a of asignaturas(); track a.id) {
                  <button
                    class="select-row"
                    type="button"
                    [class.selected]="asignaturaSel()?.id === a.id"
                    (click)="elegirAsignatura(a)"
                  >
                    <span>{{ a.nombre }}</span>
                    <span class="chevron">›</span>
                  </button>
                }
              }
            </div>
          </div>
        }

        @if (asignaturaSel()) {
          <div class="card">
            <div class="card-head">Temas</div>
            <div class="card-body stack">
              @if (temas().length === 0) {
                <p class="muted small">Sin temas registrados.</p>
              } @else {
                @for (t of temas(); track t.id) {
                  <button class="select-row" type="button" (click)="abrirTema(t)">
                    <span>
                      <strong>{{ t.titulo }}</strong>
                      <span [class]="'badge badge-' + t.dificultad_base.toLowerCase()">
                        {{ t.dificultad_base }}
                      </span>
                      <br />
                      <span class="small muted">{{ t.descripcion }}</span>
                    </span>
                    <span class="chevron">›</span>
                  </button>
                }
              }
            </div>
          </div>
        }
      </div>
    }
  `,
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
