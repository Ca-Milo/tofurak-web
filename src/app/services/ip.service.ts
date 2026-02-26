import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IpService {
  // Servicio gratuito que devuelve la IP pública
  private ipApiUrl = 'https://api.ipify.org?format=json';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la dirección IP pública del cliente en formato IPv4
   */
  getPublicIp(): Observable<string> {
    return this.http.get<{ ip: string }>(this.ipApiUrl).pipe(
      map(response => response.ip),
      catchError(err => {
        console.warn('No se pudo obtener la IP pública:', err);
        return of('');
      })
    ); 
  }
}
 