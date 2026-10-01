import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_BASE } from '../api.config';
import { Usuario } from '../models';

interface RespuestaLogin {
  usuario: Usuario;
  token: string;
}

interface RespuestaMe {
  usuario: Usuario & { correo_institucional?: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly usuarioSig = signal<Usuario | null>(null);
  private readonly verificadoSig = signal(false);

  readonly usuario = this.usuarioSig.asReadonly();
  readonly autenticado = computed(() => this.usuarioSig() !== null);

  login(correo: string, password: string): Observable<Usuario> {
    return this.http
      .post<RespuestaLogin>(`${API_BASE}/auth/login`, { correo, password })
      .pipe(
        map((r) => this.normalizar(r.usuario)),
        tap((usuario) => {
          this.usuarioSig.set(usuario);
          this.verificadoSig.set(true);
        }),
      );
  }

  logout(): Observable<void> {
    return this.http.post<{ ok: boolean }>(`${API_BASE}/auth/logout`, {}).pipe(
      tap(() => this.limpiar()),
      map(() => undefined),
      catchError(() => {
        this.limpiar();
        return of(undefined);
      }),
    );
  }

  /** Comprueba la cookie de sesión (una sola vez) y rehidrata el usuario. */
  verificarSesion(): Observable<boolean> {
    if (this.verificadoSig()) return of(this.autenticado());
    return this.http.get<RespuestaMe>(`${API_BASE}/auth/me`).pipe(
      map((r) => {
        this.usuarioSig.set(this.normalizar(r.usuario));
        this.verificadoSig.set(true);
        return true;
      }),
      catchError(() => {
        this.usuarioSig.set(null);
        this.verificadoSig.set(true);
        return of(false);
      }),
    );
  }

  limpiar(): void {
    this.usuarioSig.set(null);
    this.verificadoSig.set(true);
  }

  private normalizar(u: Usuario & { correo_institucional?: string }): Usuario {
    return {
      id: u.id,
      nombre: u.nombre,
      correo: u.correo ?? u.correo_institucional ?? '',
      rol: u.rol,
      activo: u.activo,
      creado_en: u.creado_en,
    };
  }
}
