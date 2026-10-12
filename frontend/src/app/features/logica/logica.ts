import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogoService } from '../../core/services/catalogo.service';
import { EjerciciosService } from '../../core/services/ejercicios.service';
import { PseudocodigoPipe } from '../../core/pipes/pseudocodigo.pipe';
import { Ejercicio, ResultadoValidacion, TemaDetalle } from '../../core/models';

@Component({
  selector: 'app-logica',
  imports: [RouterLink, PseudocodigoPipe],
  templateUrl: './logica.html',
  styleUrl: './logica.css',
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
