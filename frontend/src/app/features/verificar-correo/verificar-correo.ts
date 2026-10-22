import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verificar-correo',
  templateUrl: './verificar-correo.html',
  styleUrl: './verificar-correo.css',
})
export class VerificarCorreo implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly estado = signal<'cargando' | 'ok' | 'error'>('cargando');
  readonly mensaje = signal<string>('');

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.estado.set('error');
      this.mensaje.set('Token de verificación inválido.');
      return;
    }

    this.auth.verificarCorreo(token).subscribe({
      next: (res: any) => {
        this.estado.set('ok');
        this.mensaje.set(res?.mensaje || 'Correo verificado correctamente. Ya puedes iniciar sesión.');
        setTimeout(() => this.router.navigateByUrl('/login'), 2000);
      },
      error: (err) => {
        this.estado.set('error');
        this.mensaje.set(err?.error?.error || 'El token es inválido o ya fue utilizado.');
      },
    });
  }
}
