import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogoService } from '../../core/services/catalogo.service';
import { TemaDetalle } from '../../core/models';

@Component({
  selector: 'app-tema',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <a routerLink="/catalogo" class="small">← Volver al catálogo</a>
    </div>

    @if (cargando()) {
      <div class="spinner"></div>
    } @else if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    } @else if (tema(); as t) {
      <div class="card">
        <div class="card-head">
          <div>
            <h1 style="margin: 0">{{ t.titulo }}</h1>
            <div class="small muted">
              {{ t.asignatura }} · Semestre {{ t.semestre_numero }}
            </div>
          </div>
          <span [class]="'badge badge-' + t.dificultad_base.toLowerCase()">
            {{ t.dificultad_base }}
          </span>
        </div>
        <div class="card-body">
          <p>{{ t.descripcion }}</p>
          <a class="btn btn-primary" [routerLink]="['/logica', t.id]">
            Practicar ejercicios
          </a>
        </div>
      </div>

      <div class="card" style="margin-top: 18px">
        <div class="card-head">Videos de apoyo</div>
        <div class="card-body">
          @if (t.videos.length === 0) {
            <p class="muted small">Este tema aún no tiene videos.</p>
          } @else {
            @for (v of t.videos; track v.id) {
              <div class="video-item">
                <div>
                  <strong>{{ v.titulo }}</strong>
                  <div class="small muted">Duración {{ duracion(v.duracion_seg) }}</div>
                </div>
                <a class="btn btn-ghost btn-sm" [href]="v.url_youtube" target="_blank" rel="noopener">
                  Ver video
                </a>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class Tema implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CatalogoService);

  readonly tema = signal<TemaDetalle | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('temaId'));
      if (!id) return;
      this.cargando.set(true);
      this.service.tema(id).subscribe({
        next: (tema) => {
          this.tema.set(tema);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error ?? 'No se pudo cargar el tema.');
          this.cargando.set(false);
        },
      });
    });
  }

  duracion(seg: number): string {
    const min = Math.floor(seg / 60);
    const segs = seg % 60;
    return `${min}:${segs.toString().padStart(2, '0')}`;
  }
}
