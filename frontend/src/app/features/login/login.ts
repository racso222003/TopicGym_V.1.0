import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CREDENCIALES_DEMO } from '../../core/api.config';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get correo() {
    return this.form.controls.correo;
  }

  get password() {
    return this.form.controls.password;
  }

  usarDemo(tipo: 'estudiante' | 'docente'): void {
    const cred = tipo === 'docente' ? CREDENCIALES_DEMO.docente : CREDENCIALES_DEMO.estudiante;
    this.form.setValue({ correo: cred.correo, password: cred.password });
    this.error.set(null);
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    const { correo, password } = this.form.getRawValue();
    this.auth.login(correo, password).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.error ?? 'No se pudo iniciar sesión. Verifica tus datos.');
      },
    });
  }
}
