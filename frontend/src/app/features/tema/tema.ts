import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogoService } from '../../core/services/catalogo.service';
import { TemaDetalle } from '../../core/models';

@Component({
  selector: 'app-tema',
  imports: [RouterLink],
  templateUrl: './tema.html',
  styleUrl: './tema.css',
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
