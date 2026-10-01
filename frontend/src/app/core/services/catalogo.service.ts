import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../api.config';
import { Asignatura, Semestre, TemaDetalle, TemaResumen } from '../models';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);

  semestres(): Observable<Semestre[]> {
    return this.http
      .get<{ semestres: Semestre[] }>(`${API_BASE}/semesters`)
      .pipe(map((r) => r.semestres));
  }

  asignaturas(semestreId: number): Observable<Asignatura[]> {
    return this.http
      .get<{ asignaturas: Asignatura[] }>(`${API_BASE}/semesters/${semestreId}/subjects`)
      .pipe(map((r) => r.asignaturas));
  }

  temas(asignaturaId: number): Observable<TemaResumen[]> {
    return this.http
      .get<{ temas: TemaResumen[] }>(`${API_BASE}/subjects/${asignaturaId}/topics`)
      .pipe(map((r) => r.temas));
  }

  tema(temaId: number): Observable<TemaDetalle> {
    return this.http
      .get<{ tema: TemaDetalle }>(`${API_BASE}/topics/${temaId}`)
      .pipe(map((r) => r.tema));
  }
}
