import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
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
