import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../api.config';
import { Ejercicio, Nivel, ResultadoValidacion } from '../models';

@Injectable({ providedIn: 'root' })
export class EjerciciosService {
  private readonly http = inject(HttpClient);

  listar(temaId: number, nivel?: Nivel | ''): Observable<Ejercicio[]> {
    let params = new HttpParams().set('temaId', temaId);
    if (nivel) params = params.set('nivel', nivel);
    return this.http
      .get<{ ejercicios: Ejercicio[] }>(`${API_BASE}/exercises`, { params })
      .pipe(map((r) => r.ejercicios));
  }

  validar(
    ejercicioId: number,
    respuesta: { opcionId?: number; textoRespuesta?: string },
  ): Observable<ResultadoValidacion> {
    return this.http.post<ResultadoValidacion>(
      `${API_BASE}/exercises/${ejercicioId}/validate`,
      respuesta,
    );
  }
}
