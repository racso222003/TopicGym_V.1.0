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
  total_alumnos?: number;
}

export interface LogroAlumno {
  codigo: string;
  nombre: string;
  descripcion: string;
  puntos: number;
  obtenido_en: string;
}

export type EstadoActividad = 'ACTIVO' | 'RACHA' | 'INACTIVO';

export interface AlumnoProgreso {
  id: string;
  codigo_id: number;
  nombre: string;
  correo: string;
  codigo_usado: string;
  asignatura_id: number | null;
  asignatura_nombre: string | null;
  total_ejercicios: number;
  ejercicios_resueltos: number;
  puntos_totales: number;
  ultima_actividad: string | null;
  racha_dias: number;
  estado_actividad: EstadoActividad;
  logros: LogroAlumno[];
}

export interface TemaProgreso {
  tema_id: number;
  titulo: string;
  total_ejercicios: number;
  resueltos: number;
  intentados: number;
  porcentaje: number;
}

export interface IntentoHistorial {
  id: string;
  respondido_en: string;
  correcta: boolean;
  intento: number;
  ejercicio_id: number;
  ejercicio: string;
  tema: string;
}

export interface DetalleAlumno {
  alumno: {
    id: string;
    nombre: string;
    correo: string;
    codigo_usado: string;
    asignatura_id: number | null;
    asignatura_nombre: string | null;
  };
  temas: TemaProgreso[];
  historial: IntentoHistorial[];
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

  eliminarCodigo(codigoId: number): Observable<{
    ok: boolean;
    codigo: string;
    eliminado: boolean;
    activo?: boolean;
  }> {
    return this.http.delete<{
      ok: boolean;
      codigo: string;
      eliminado: boolean;
      activo?: boolean;
    }>(`${API_BASE}/teachers/codes/${codigoId}`);
  }

  obtenerProgresoAlumnos(): Observable<RespuestaProgresoAlumnos> {
    return this.http.get<RespuestaProgresoAlumnos>(`${API_BASE}/teachers/students-progress`);
  }

  obtenerDetalleAlumno(estudianteId: string, codigoId: number): Observable<DetalleAlumno> {
    return this.http.get<DetalleAlumno>(
      `${API_BASE}/teachers/students/${estudianteId}/codes/${codigoId}/detalle`,
    );
  }
}
