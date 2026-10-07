import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CREDENCIALES_DEMO } from '../../core/api.config';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-screen">
      <div class="card login-card">
        <div class="card-body">
          <div class="brand-mark">
            <span class="brand-logo">TG</span>
            <div>
              <h1 style="font-size: 20px; margin: 0">TopicGym</h1>
              <div class="small muted">Lógica de Programación</div>
            </div>
          </div>
          <p class="muted small" style="margin-top: 12px">
            Ingresa con tu correo institucional para continuar.
          </p>

          @if (error()) {
            <div class="alert alert-error" role="alert">{{ error() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="enviar()">
            <div class="field">
              <label for="correo">Correo institucional</label>
              <input
                id="correo"
                class="input"
                type="email"
                formControlName="correo"
                placeholder="usuario@institucion.edu.co"
                autocomplete="username"
                [class.is-invalid]="correo.invalid && correo.touched"
              />
              @if (correo.invalid && correo.touched) {
                <span class="field-error">Ingresa un correo válido.</span>
              }
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <input
                id="password"
                class="input"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                [class.is-invalid]="password.invalid && password.touched"
              />
              @if (password.invalid && password.touched) {
                <span class="field-error">La contraseña es obligatoria.</span>
              }
            </div>

            <button class="btn btn-primary btn-block" type="submit" [disabled]="cargando()">
              {{ cargando() ? 'Ingresando…' : 'Ingresar' }}
            </button>
          </form>

          <div class="small muted" style="margin-top: 18px">Cuentas demo</div>
          <div class="row" style="margin-top: 8px">
            <button class="btn btn-ghost btn-sm" type="button" (click)="usarDemo('estudiante')">
              Estudiante
            </button>
            <button class="btn btn-ghost btn-sm" type="button" (click)="usarDemo('docente')">
              Docente
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
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
