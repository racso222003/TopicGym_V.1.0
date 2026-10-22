import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

export interface Asignatura {
  id: number;
  nombre: string;
  semestre_id?: number;
  semestre_numero?: number;
}

export interface CodigoClase {
  id: number;
  docente_id?: string;
  codigo: string;
  activo: boolean;
  fecha_creacion: string;
  asignatura_id?: number | null;
  asignatura_nombre?: string;
  semestre_numero?: number;
}

export interface LogroAlumno {
  codigo: string;
  nombre: string;
  descripcion: string;
  puntos: number;
  obtenido_en: string;
}

export interface AlumnoProgreso {
  id: string;
  nombre: string;
  correo: string;
  codigo_usado: string;
  asignatura_id?: number;
  asignatura_nombre?: string;
  ejercicios_resueltos: number;
  puntos_totales: number;
  logros: LogroAlumno[];
}

interface RespuestaCrearCodigo {
  codigo: CodigoClase;
}

interface RespuestaListarCodigos {
  codigos: CodigoClase[];
}

interface RespuestaAsignaturas {
  asignaturas: Asignatura[];
}

interface RespuestaProgresoAlumnos {
  alumnos: AlumnoProgreso[];
}

@Injectable({ providedIn: 'root' })
export class TeachersService {
  private readonly http = inject(HttpClient);

  listarAsignaturas(): Observable<RespuestaAsignaturas> {
    return this.http.get<RespuestaAsignaturas>(`${API_BASE}/teachers/asignaturas`);
  }

  generarCodigo(asignaturaId?: number | null): Observable<RespuestaCrearCodigo> {
    return this.http.post<RespuestaCrearCodigo>(`${API_BASE}/teachers/codes`, { asignaturaId });
  }

  listarCodigos(): Observable<RespuestaListarCodigos> {
    return this.http.get<RespuestaListarCodigos>(`${API_BASE}/teachers/codes`);
  }

  obtenerProgresoAlumnos(): Observable<RespuestaProgresoAlumnos> {
    return this.http.get<RespuestaProgresoAlumnos>(`${API_BASE}/teachers/students-progress`);
  }
}
