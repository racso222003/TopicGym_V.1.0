import { SlicePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface CodigoVinculado {
  codigo_id: number;
  codigo: string;
  activo: boolean;
  asignatura_nombre: string | null;
  docente_nombre: string;
  docente_correo: string;
}

@Component({
  selector: 'app-perfil',
  imports: [SlicePipe, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly usuario = this.auth.usuario;
  readonly esEstudiante = this.auth.esEstudiante;
  readonly inicial = computed(() => (this.usuario()?.nombre?.charAt(0) ?? '?').toUpperCase());

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/\S/)]],
    correo: [{ value: '', disabled: true }],
    telefono: ['', [Validators.maxLength(20)]],
    ciudad: ['', [Validators.maxLength(80)]],
    direccion: ['', [Validators.maxLength(150)]],
  });

  readonly vinculoForm = this.fb.group({
    codigo: ['', [Validators.required]],
  });

  readonly guardando = signal(false);
  readonly vinculando = signal(false);
  readonly cargandoCodigos = signal(false);
  readonly mensaje = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly codigos = signal<CodigoVinculado[]>([]);

  get nombre() {
    return this.form.controls.nombre;
  }

  ngOnInit(): void {
    const u = this.usuario();
    if (u) {
      this.form.patchValue({
        nombre: u.nombre ?? '',
        correo: u.correo ?? '',
        telefono: u.telefono ?? '',
        ciudad: u.ciudad ?? '',
        direccion: u.direccion ?? '',
      });
    }
    if (this.esEstudiante()) {
      this.cargarMisCodigos();
    }
  }

  cargarMisCodigos(): void {
    this.cargandoCodigos.set(true);
    this.auth.misCodigos().subscribe({
      next: (res: { codigos: CodigoVinculado[] }) => {
        this.codigos.set(res.codigos ?? []);
        this.cargandoCodigos.set(false);
      },
      error: () => this.cargandoCodigos.set(false),
    });
  }

  guardarPerfil(): void {
    if (this.form.invalid || !this.form.dirty || this.guardando()) return;

    this.guardando.set(true);
    this.mensaje.set(null);
    this.error.set(null);

    const { nombre, telefono, ciudad, direccion } = this.form.getRawValue();
    this.auth.actualizarPerfil({ nombre: nombre.trim(), telefono, ciudad, direccion }).subscribe({
      next: (res: { mensaje?: string }) => {
        this.guardando.set(false);
        this.form.markAsPristine();
        this.mostrarMensaje(res.mensaje ?? 'Perfil actualizado correctamente.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.error ?? 'No se pudo actualizar el perfil.');
      },
    });
  }

  vincular(): void {
    const codigo = this.vinculoForm.controls.codigo.value.trim().toUpperCase();
    if (!codigo || this.vinculando()) return;

    this.vinculando.set(true);
    this.mensaje.set(null);
    this.error.set(null);

    this.auth.vincularCodigo(codigo).subscribe({
      next: (res: { mensaje?: string }) => {
        this.vinculando.set(false);
        this.vinculoForm.reset();
        this.cargarMisCodigos();
        this.mostrarMensaje(res.mensaje ?? 'Vinculado correctamente.');
      },
      error: (err) => {
        this.vinculando.set(false);
        this.error.set(err?.error?.error ?? 'No se pudo vincular el código.');
      },
    });
  }

  salir(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  private mostrarMensaje(texto: string): void {
    this.mensaje.set(texto);
    setTimeout(() => this.mensaje.set(null), 3000);
  }
}
