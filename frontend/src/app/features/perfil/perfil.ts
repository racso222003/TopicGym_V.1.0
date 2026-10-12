import { SlicePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  imports: [SlicePipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
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
