import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE } from './api.constants';

@Injectable({ providedIn: 'root' })
export class ServerStatusService {
  // Construimos la URL a partir de la constante API_BASE
  private url = `${API_BASE}/status`;

  constructor(private http: HttpClient) {}

  getServerStatus(): Observable<any> {
    return this.http.get<any>(this.url).pipe(
      catchError((err) => {
        console.error('Error en ServerStatusService:', err);
        throw err;
      })
    );
  }
}
 