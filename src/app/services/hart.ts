import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { API_BASE } from './api.constants';

export interface User {
  id: string;
  cuenta: string;

  apodo?: string;
  abono?: number;
  ogrinas?: number;
  email?: string;

  // ✅ agrega estas (son las que te subraya el HTML)
  lastIP?: string;
  question?: string;

  // (opcional) si en algún lado usas "account" como alternativa
  account?: string;
  ips?: string[]; // Lista de IPs permitidas para este usuario
  personajes?: Character[]; // Lista de personajes del usuario
}

export interface Character {
  id: number;
  nombre: string;
  nivel: number;
  clase: number;
  sexo: number;
}

export interface RankingEntry {
  id?: number | string;
  nombre?: string;
  name?: string;
  clase?: number | string;
  sexo?: number | string;
  nivel?: number | string;
  experiencia?: number | string;
  exp?: number | string;
  victorias?: number | string;
  wins?: number | string;
  derrotas?: number | string;
  losses?: number | string;
  rating?: number | string;
  puntos?: number | string;
  xp?: number | string;
}

export interface RankingResponse {
  success?: boolean;
  message?: string;
  data?: RankingEntry[];
}
 
 
export interface AuthResponse {
  success: boolean;
  message: string;
  data: User;
  token: string;
} 

export interface RegisterPayload {
  username: string;
  name?: string;
  lastname?: string;
  nickname?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  secretQuestion?: string;
  secretAnswer?: string;
  day?: number | string;
  month?: number | string;
  year?: number | string;
  accounts?: string | number;
  ipv4?: string;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class Hart {
  private apiUrl = API_BASE;
  private tokenKey = 'authToken';
  private userKey = 'currentUser';

  // BehaviorSubjects para reactividad
  private authStatusSubject = new BehaviorSubject<boolean>(this.hasToken());
  public authStatus$ = this.authStatusSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSession();
  }
 
 
  /**
   * Registra un nuevo usuario
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, payload).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.saveToken(response.token);
          this.saveUser(response.data);
          this.authStatusSubject.next(true);
          this.currentUserSubject.next(response.data);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Inicia sesión de un usuario existente
   */
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      username,
      password,
    }).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.saveToken(response.token);
          this.saveUser(response.data);
          this.authStatusSubject.next(true);
          this.currentUserSubject.next(response.data);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  getProfile(): Observable<{ success: boolean; data: User }> {
    const headers = this.getAuthHeaders(); 
    return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/account/profile`, { headers }).pipe(
      tap((response) => {
        if (response?.success && response?.data) {
          this.saveUser(response.data);
          this.currentUserSubject.next(response.data);
          this.authStatusSubject.next(true);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Elimina una IP permitida de la cuenta actual
   */
  deleteAllowedIp(ip: string): Observable<{ success: boolean; message?: string; data?: User }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ success: boolean; message?: string; data?: User }>(
      `${this.apiUrl}/account/allowed-ips/delete`,
      { ip },
      { headers },
    ).pipe(
      tap((response) => {
        if (response?.success && response?.data) {
          this.saveUser(response.data);
          this.currentUserSubject.next(response.data);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Cambia la contraseña de la cuenta actual
   */
  changePassword(payload: { secretAnswer: string; newPassword: string }): Observable<{ success: boolean; message?: string; data?: User }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ success: boolean; message?: string; data?: User }>(
      `${this.apiUrl}/account/change-password`,
      payload,
      { headers },
    ).pipe(
      tap((response) => {
        if (response?.success && response?.data) {
          this.saveUser(response.data);
          this.currentUserSubject.next(response.data);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Ranking PvM
   */
  getPvmRanking(): Observable<RankingResponse> {
    return this.http.get<RankingResponse>(`${this.apiUrl}/ranking/pvm`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Ranking PvP
   */
  getPvpRanking(): Observable<RankingResponse> {
    return this.http.get<RankingResponse>(`${this.apiUrl}/ranking/pvp`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Ranking Koliseo
   */
  getKoliseoRanking(): Observable<RankingResponse> {
    return this.http.get<RankingResponse>(`${this.apiUrl}/ranking/koliseo`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.authStatusSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Obtiene el token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.getStoredUser();
  }

  /**
   * Restaura la sesión si existe un token válido
   */
  private restoreSession(): void {
    const token = this.getToken();
    const storedUser = this.getStoredUser();
    
    if (token && storedUser) {
      // Restaurar usuario desde localStorage inmediatamente
      this.authStatusSubject.next(true);
      this.currentUserSubject.next(storedUser);
      
      // Verificar que el token sea válido con el backend (sin desloguear si falla)
      this.getProfile().subscribe({
        next: (response) => {
          if (response.success) {
            // Token válido, actualizar datos si cambiaron
            this.currentUserSubject.next(response.data);
          } else {
            // Token no válido, cerrar sesión
            this.logout();
          }
        },
        error: () => {
          // Error al conectar con el backend, mantener sesión del localStorage
          // No hacer logout - el token puede ser válido pero el servidor no responde
          console.warn('No se pudo verificar el token con el servidor, manteniéndose sesión local');
        },
      });
    }
  }

  /**
   * Crea headers con el token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Guarda el token en localStorage
   */
  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Guarda el usuario en localStorage
   */
  private saveUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Obtiene el usuario del localStorage
   */
  private getStoredUser(): User | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Verifica si hay un token guardado
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * Maneja los errores de la API
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente 
      errorMessage = error.error.message; 
    } else if (error.error && typeof error.error === 'object') {
      // Error del servidor - intenta extraer message de varias formas
      errorMessage = error.error.message 
        || error.error.error 
        || (typeof error.error === 'string' ? error.error : 'Error en la solicitud');
    } else if (typeof error.error === 'string') {
      // Si error.error es un string directo
      errorMessage = error.error;
    }

    console.error('Error en Hart:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
