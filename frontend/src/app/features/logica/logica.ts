import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogoService } from '../../core/services/catalogo.service';
import { EjerciciosService } from '../../core/services/ejercicios.service';
import { Ejercicio, ResultadoValidacion, TemaDetalle } from '../../core/models';

@Component({
  selector: 'app-logica',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <a [routerLink]="temaId() ? ['/tema', temaId()] : ['/catalogo']" class="small">
        ← Volver al tema
      </a>
      <h1>{{ tema()?.titulo ?? 'Ejercicios' }}</h1>
      <p>Resuelve cada ejercicio. Los puntos se otorgan solo en el primer intento correcto.</p>
    </div>

    @if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
    }

    @if (cargando()) {
      <div class="spinner"></div>
    } @else if (ejercicios().length === 0) {
      <div class="empty">Este tema aún no tiene ejercicios en el banco piloto.</div>
    } @else {
      @for (ej of ejercicios(); track ej.id; let i = $index) {
        <div class="card exercise">
          <div class="card-head">
            <span class="exercise-head">
              <span>Ejercicio {{ i + 1 }} · {{ ej.titulo }}</span>
              <span>
                <span [class]="'badge badge-' + ej.nivel.toLowerCase()">{{ ej.nivel }}</span>
                <span class="badge badge-active">{{ ej.puntos_ponderados }} pts</span>
              </span>
            </span>
          </div>
          <div class="card-body">
            <div class="enunciado">{{ ej.enunciado }}</div>

            @if (ej.codigo_referencia) {
              <pre class="codigo-ref">{{ ej.codigo_referencia }}</pre>
            }

            @if (ej.pista) {
              @if (pistaVisible()[ej.id]) {
                <div class="pista">Pista: {{ ej.pista }}</div>
              } @else {
                <button class="btn btn-ghost btn-sm" type="button" (click)="verPista(ej.id)">
                  Ver pista
                </button>
              }
            }

            @if (ej.tipo === 'OPCION_MULTIPLE') {
              <div class="opciones">
                @for (op of ej.opciones; track op.id) {
                  <label
                    class="opcion"
                    [class.selected]="seleccion()[ej.id] === op.id"
                    [class.correcta]="resultados()[ej.id]?.opcionCorrectaId === op.id"
                    [class.incorrecta]="
                      resultados()[ej.id]?.opcionCorrectaId !== op.id &&
                      seleccion()[ej.id] === op.id &&
                      resultados()[ej.id] !== undefined
                    "
                  >
                    <input
                      type="radio"
                      [name]="'ej-' + ej.id"
                      [value]="op.id"
                      [checked]="seleccion()[ej.id] === op.id"
                      (change)="elegir(ej.id, op.id)"
                    />
                    <span>{{ op.texto }}</span>
                  </label>
                }
              </div>
            } @else {
              <textarea
                class="textarea"
                placeholder="Escribe tu solución en pseudocódigo..."
                [value]="texto()[ej.id] ?? ''"
                (input)="escribir(ej.id, $any($event.target).value)"
              ></textarea>
            }

            <div class="row">
              <button
                class="btn btn-primary"
                type="button"
                [disabled]="enviando() === ej.id"
                (click)="enviar(ej)"
              >
                {{ enviando() === ej.id ? 'Validando…' : resultados()[ej.id] ? 'Reintentar' : 'Responder' }}
              </button>
            </div>

            @if (resultados()[ej.id]; as r) {
              <div
                class="result-panel"
                [class.result-ok]="r.correcta"
                [class.result-bad]="!r.correcta"
                role="status"
              >
                <strong>
                  {{ r.correcta ? 'Correcto' : 'Incorrecto' }} ·
                  {{ r.puntos }} puntos (intento {{ r.intento }})
                </strong>
                @if (r.explicacion) {
                  <p style="margin: 8px 0 0">{{ r.explicacion }}</p>
                }
                @if (!r.correcta && r.primerIntento) {
                  <p class="small" style="margin: 6px 0 0">
                    El intento no otorgó puntos. Puedes reintentar.
                  </p>
                }
                @if (r.logros.length > 0) {
                  <div class="alert alert-ok" style="margin: 10px 0 0">
                    ¡Nuevo logro!
                    @for (l of r.logros; track l.codigo) {
                      <div>· {{ l.nombre }} (+{{ l.puntos }} pts)</div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class Logica implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ejerciciosService = inject(EjerciciosService);
  private readonly catalogoService = inject(CatalogoService);

  readonly temaId = signal<number>(0);
  readonly tema = signal<TemaDetalle | null>(null);
  readonly ejercicios = signal<Ejercicio[]>([]);
  readonly seleccion = signal<Record<number, number>>({});
  readonly texto = signal<Record<number, string>>({});
  readonly resultados = signal<Record<number, ResultadoValidacion>>({});
  readonly pistaVisible = signal<Record<number, boolean>>({});
  readonly enviando = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('temaId'));
      if (!id) return;
      this.temaId.set(id);
      this.cargar(id);
    });
  }

  private cargar(temaId: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.catalogoService.tema(temaId).subscribe({
      next: (t) => this.tema.set(t),
      error: () => this.tema.set(null),
    });
    this.ejerciciosService.listar(temaId).subscribe({
      next: (ejercicios) => {
        this.ejercicios.set(ejercicios);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudieron cargar los ejercicios.');
        this.cargando.set(false);
      },
    });
  }

  elegir(ejercicioId: number, opcionId: number): void {
    this.seleccion.update((m) => ({ ...m, [ejercicioId]: opcionId }));
  }

  escribir(ejercicioId: number, valor: string): void {
    this.texto.update((m) => ({ ...m, [ejercicioId]: valor }));
  }

  verPista(ejercicioId: number): void {
    this.pistaVisible.update((m) => ({ ...m, [ejercicioId]: true }));
  }

  enviar(ej: Ejercicio): void {
    const body: { opcionId?: number; textoRespuesta?: string } = {};
    if (ej.tipo === 'OPCION_MULTIPLE') {
      const opcionId = this.seleccion()[ej.id];
      if (!opcionId) {
        this.error.set(`Selecciona una opción para el ejercicio "${ej.titulo}".`);
        return;
      }
      body.opcionId = opcionId;
    } else {
      const textoRespuesta = (this.texto()[ej.id] ?? '').trim();
      if (!textoRespuesta) {
        this.error.set(`Escribe tu respuesta para el ejercicio "${ej.titulo}".`);
        return;
      }
      body.textoRespuesta = textoRespuesta;
    }

    this.enviando.set(ej.id);
    this.error.set(null);
    this.ejerciciosService.validar(ej.id, body).subscribe({
      next: (resultado) => {
        this.resultados.update((m) => ({ ...m, [ej.id]: resultado }));
        this.enviando.set(null);
      },
      error: (err) => {
        this.enviando.set(null);
        this.error.set(err?.error?.error ?? 'No se pudo validar la respuesta.');
      },
    });
  }
}
