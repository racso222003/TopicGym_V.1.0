import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly verifyUrl = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    rol: ['ESTUDIANTE' as 'ESTUDIANTE' | 'DOCENTE', [Validators.required]],
  });

  get nombre() { return this.form.controls.nombre; }
  get correo() { return this.form.controls.correo; }
  get password() { return this.form.controls.password; }
  get rol() { return this.form.controls.rol; }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.verifyUrl.set(null);

    const raw = this.form.getRawValue();
    const payload: any = {
      nombre: raw.nombre.trim(),
      correo: raw.correo.trim().toLowerCase(),
      password: raw.password,
      rol: raw.rol,
    };

    this.auth.register(payload).subscribe({
      next: (res: any) => {
        this.cargando.set(false);
        this.exito.set(res.mensaje || 'Registro exitoso. Revisa tu correo para verificar tu cuenta.');
        if (res.verifyUrl) this.verifyUrl.set(res.verifyUrl);
        this.form.reset({ nombre: '', correo: '', password: '', rol: 'ESTUDIANTE' });
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.error ?? err?.error?.message ?? 'No se pudo registrar. Intenta nuevamente.');
      },
    });
  }
}
