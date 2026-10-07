import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a href="#contenido" class="skip-link">Saltar al contenido</a>
    <div class="shell">
      <div class="brand">
        <span class="brand-logo">TG</span>
        TopicGym
      </div>

      <header class="topbar">
        <div class="small muted">Lógica de Programación</div>
        <div class="topbar-user">
          <div class="avatar" aria-hidden="true">{{ inicial() }}</div>
          <div class="usuario-info">
            <div class="small"><strong>{{ usuario()?.nombre }}</strong></div>
            <div class="small muted">{{ etiquetaRol() }}</div>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" (click)="salir()">Salir</button>
        </div>
      </header>

      <nav class="sidebar" aria-label="Menú principal">
        <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Inicio</a>
        <a class="nav-link" routerLink="/catalogo" routerLinkActive="active">Catálogo</a>
        <a class="nav-link" routerLink="/progreso" routerLinkActive="active">Mi progreso</a>
        <a class="nav-link" routerLink="/logros" routerLinkActive="active">Logros</a>
        <a class="nav-link" routerLink="/perfil" routerLinkActive="active">Mi perfil</a>
      </nav>

      <main class="content" id="contenido" tabindex="-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.auth.usuario;
  readonly inicial = computed(() => (this.usuario()?.nombre.charAt(0) ?? '?').toUpperCase());
  readonly etiquetaRol = computed(() => {
    const rol = this.usuario()?.rol;
    if (rol === 'DOCENTE') return 'Docente';
    if (rol === 'ADMIN') return 'Administrador';
    return 'Estudiante';
  });

  salir(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
