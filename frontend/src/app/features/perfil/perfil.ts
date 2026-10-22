import { SlicePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  imports: [SlicePipe, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.auth.usuario;
  readonly inicial = () => (this.usuario()?.nombre?.charAt(0) ?? '?').toUpperCase();

  readonly guardando = signal(false);
  readonly vinculando = signal(false);
  readonly cargandoCodigos = signal(false);
  readonly mensaje = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  nombre = '';
  telefono = '';
  direccion = '';
  ciudad = '';
  codigoVincular = '';

  readonly misCodigos = signal<any[]>([]);

  ngOnInit(): void {
    const u = this.usuario();
    if (u) {
      this.nombre = u.nombre || '';
      this.telefono = (u as any).telefono || '';
      this.direccion = (u as any).direccion || '';
      this.ciudad = (u as any).ciudad || '';
    }
    this.cargarMisCodigos();
  }

  cargarMisCodigos(): void {
    this.cargandoCodigos.set(true);
    this.auth.misCodigos().subscribe({
      next: (res: any) => {
        this.misCodigos.set(res.codigos || []);
        this.cargandoCodigos.set(false);
      },
      error: () => this.cargandoCodigos.set(false),
    });
  }

  guardarPerfil(): void {
    this.guardando.set(true);
    this.mensaje.set(null);
    this.error.set(null);
    this.auth.actualizarPerfil({ nombre: this.nombre, telefono: this.telefono, direccion: this.direccion, ciudad: this.ciudad }).subscribe({
      next: (res: any) => {
        this.guardando.set(false);
        this.mensaje.set(res.mensaje || 'Perfil actualizado correctamente.');
        setTimeout(() => this.mensaje.set(null), 3000);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.error || 'No se pudo actualizar el perfil.');
      },
    });
  }

  vincular(): void {
    if (!this.codigoVincular.trim()) return;
    this.vinculando.set(true);
    this.mensaje.set(null);
    this.error.set(null);
    this.auth.vincularCodigo(this.codigoVincular.trim().toUpperCase()).subscribe({
      next: (res: any) => {
        this.vinculando.set(false);
        this.mensaje.set(res.mensaje || 'Vinculado correctamente.');
        this.codigoVincular = '';
        this.cargarMisCodigos();
        setTimeout(() => this.mensaje.set(null), 3000);
      },
      error: (err) => {
        this.vinculando.set(false);
        this.error.set(err?.error?.error || 'No se pudo vincular el código.');
      },
    });
  }

  salir(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
