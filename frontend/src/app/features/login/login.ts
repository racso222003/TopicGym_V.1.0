import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarPass = signal(false);

  readonly form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    recordar: [false],
  });

  get correo() {
    return this.form.controls.correo;
  }

  get password() {
    return this.form.controls.password;
  }

  togglePassword(): void {
    this.mostrarPass.update((v) => !v);
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.cargando()) return;

    this.cargando.set(true);
    this.error.set(null);
    const { correo, password } = this.form.getRawValue();

    this.auth.login(correo, password).subscribe({
      next: (usuario) => {
        const rol = usuario.rol ?? usuario.rol_codigo;
        const destino = rol === 'DOCENTE' || rol === 'ADMIN' ? '/teacher-dashboard' : '/catalogo';
        this.router.navigateByUrl(destino);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.error ?? 'No se pudo iniciar sesión. Verifica tus datos.');
      },
    });
  }
}
