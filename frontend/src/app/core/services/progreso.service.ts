import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../api.config';
import { Logro, ProgresoTema, Stats } from '../models';

@Injectable({ providedIn: 'root' })
export class ProgresoService {
  private readonly http = inject(HttpClient);

  stats(): Observable<Stats> {
    return this.http.get<{ stats: Stats }>(`${API_BASE}/stats`).pipe(map((r) => r.stats));
  }

  progreso(): Observable<ProgresoTema[]> {
    return this.http
      .get<{ progreso: ProgresoTema[] }>(`${API_BASE}/progress`)
      .pipe(map((r) => r.progreso));
  }

  logros(): Observable<Logro[]> {
    return this.http
      .get<{ logros: Logro[] }>(`${API_BASE}/achievements`)
      .pipe(map((r) => r.logros));
  }
}
