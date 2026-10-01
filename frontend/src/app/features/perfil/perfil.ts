import { SlicePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  imports: [SlicePipe],
  template: `
    <div class="page-head">
      <h1>Mi perfil</h1>
      <p>Datos de tu cuenta institucional.</p>
    </div>

    @if (usuario(); as u) {
      <div class="card" style="max-width: 520px">
        <div class="card-head">
          <div class="topbar-user">
            <div class="avatar">{{ inicial() }}</div>
            <div>
              <strong>{{ u.nombre }}</strong>
              <div class="small muted">{{ u.correo }}</div>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="spread" style="padding: 8px 0; border-bottom: 1px solid var(--border)">
            <span class="muted">Rol</span>
            <span>{{ u.rol }}</span>
          </div>
          <div class="spread" style="padding: 8px 0; border-bottom: 1px solid var(--border)">
            <span class="muted">Estado</span>
            <span>{{ u.activo === false ? 'Inactivo' : 'Activo' }}</span>
          </div>
          @if (u.creado_en) {
            <div class="spread" style="padding: 8px 0">
              <span class="muted">Miembro desde</span>
              <span>{{ u.creado_en | slice: 0 : 10 }}</span>
            </div>
          }
          <div style="margin-top: 16px">
            <button class="btn btn-ghost" type="button" (click)="salir()">Cerrar sesión</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class Perfil {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.auth.usuario;
  readonly inicial = () => (this.usuario()?.nombre.charAt(0) ?? '?').toUpperCase();

  salir(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
