import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_BASE } from '../api.config';
import { Usuario } from '../models';

interface RespuestaLogin {
  usuario: Usuario & { rol_codigo?: string; correo_institucional?: string };
  token: string;
}

interface RespuestaMe {
  usuario: Usuario & { rol_codigo?: string; correo_institucional?: string };
}

interface RespuestaRegistro {
  ok: boolean;
  mensaje: string;
  usuario: Usuario & { rol_codigo?: string; correo_institucional?: string };
}

interface RespuestaVerificacion {
  ok: boolean;
  mensaje: string;
  usuario: Usuario & { rol_codigo?: string; correo_institucional?: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly usuarioSig = signal<Usuario | null>(null);
  private readonly verificadoSig = signal(false);

  readonly usuario = this.usuarioSig.asReadonly();
  readonly autenticado = computed(() => this.usuarioSig() !== null);
  readonly esDocente = computed(() => {
    const u = this.usuarioSig();
    const rol = u?.rol ?? u?.rol_codigo ?? null;
    return rol === 'DOCENTE' || rol === 'ADMIN';
  });
  readonly esEstudiante = computed(() => {
    const u = this.usuarioSig();
    const rol = u?.rol ?? u?.rol_codigo ?? null;
    return rol === 'ESTUDIANTE';
  });

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

  register(payload: {
    nombre: string;
    correo: string;
    password: string;
    rol: 'ESTUDIANTE' | 'DOCENTE';
    codigoClase?: string;
  }): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${API_BASE}/auth/register`, payload);
  }

  verify(token: string): Observable<RespuestaVerificacion> {
    return this.http.get<RespuestaVerificacion>(`${API_BASE}/auth/verify/${token}`);
  }

  verificarCorreo(token: string): Observable<RespuestaVerificacion> {
    return this.verify(token);
  }

  actualizarPerfil(datos: { nombre?: string; telefono?: string; direccion?: string; ciudad?: string }): Observable<any> {
    return this.http.patch(`${API_BASE}/auth/me`, datos).pipe(
      tap((res: any) => {
        if (res?.usuario) {
          this.usuarioSig.set(this.normalizar({ ...res.usuario, rol: res.usuario.rol || res.usuario.rol_codigo }));
        }
      }),
    );
  }

  misCodigos(): Observable<any> {
    return this.http.get(`${API_BASE}/auth/mis-codigos`);
  }

  vincularCodigo(codigo: string): Observable<any> {
    return this.http.post(`${API_BASE}/auth/link-code`, { codigo });
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

  private normalizar(u: Usuario & { rol_codigo?: string; correo_institucional?: string }): Usuario {
    const rol = (u.rol ?? u.rol_codigo) as Usuario['rol'];
    return {
      id: u.id,
      nombre: u.nombre,
      correo: u.correo ?? u.correo_institucional ?? '',
      correo_institucional: u.correo_institucional,
      rol,
      rol_codigo: rol,
      rol_id: u.rol_id,
      activo: u.activo,
      creado_en: u.creado_en,
      email_verificado: u.email_verificado,
      telefono: u.telefono,
      direccion: u.direccion,
      ciudad: u.ciudad,
    };
  }
}
