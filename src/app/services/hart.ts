import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { API_BASE } from './api.constants';

export interface User {
  id: string;
  cuenta: string;
  rango?: number;
  rank?: number;
  module?: number | string;

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
  gremio?: string;
  guild?: string;
  clase?: number | string;
  sexo?: number | string;
  emblema?: string;
  nivel?: number | string;
  experiencia?: number | string;
  exp?: number | string;
  miembros?: number | string;
  memberCount?: number | string;
  victorias?: number | string;
  wins?: number | string;
  derrotas?: number | string;
  losses?: number | string;
  rating?: number | string;
  puntos?: number | string;
  xp?: number | string;
  gradoalas?: number | string;
  honor?: number | string;
  mobs?: string;
  primeraMuerte?: string;
  ultimaMuerte?: string;
  mejor_tiempo_ms?: number | string;
  fecha_mejor_tiempo?: string;
}

export type MobRankingOrderBy = 'victorias' | 'mejorTiempo';

export interface RankingResponse {
  success?: boolean;
  message?: string;
  data?: RankingEntry[];
  orderBy?: MobRankingOrderBy;
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
          const normalizedUser = this.normalizeUser(response.data);
          this.saveToken(response.token);
          this.saveUser(normalizedUser);
          this.authStatusSubject.next(true);
          this.currentUserSubject.next(normalizedUser);
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
          const normalizedUser = this.normalizeUser(response.data);
          this.saveToken(response.token);
          this.saveUser(normalizedUser);
          this.authStatusSubject.next(true);
          this.currentUserSubject.next(normalizedUser);
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
          const normalizedUser = this.normalizeUser(response.data);
          this.saveUser(normalizedUser);
          this.currentUserSubject.next(normalizedUser);
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
          const normalizedUser = this.normalizeUser(response.data);
          this.saveUser(normalizedUser);
          this.currentUserSubject.next(normalizedUser);
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
          const normalizedUser = this.normalizeUser(response.data);
          this.saveUser(normalizedUser);
          this.currentUserSubject.next(normalizedUser);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Solicita la recuperación de contraseña para un email
   */
  recoverPassword(email: string): Observable<{success: boolean, message: string}> {
    return this.http.post<{success: boolean, message: string}>(`/pagos/recuperar`, { email }).pipe(
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
   * Ranking Gremios
   */
  getGremiosRanking(): Observable<RankingResponse> {
    return this.http.get<RankingResponse>(`${this.apiUrl}/ranking/gremios`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Ranking por evento de mobs con parametros dinamicos
   */
  getMobRanking(
    mobId: number,
    start: number,
    end: number,
    orderBy: MobRankingOrderBy = 'victorias',
  ): Observable<RankingResponse> {
    const params = new HttpParams().set('orderBy', orderBy);

    return this.http.get<RankingResponse>(`${this.apiUrl}/ranking/mob/${mobId}/${start}/${end}`, { params }).pipe(
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
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.getStoredUser();
  }

  getNews(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/news`).pipe(
      catchError(error => this.handleError(error))
    );
  }

   getNewsUltimate(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/news/ultimate`).pipe(
      catchError(error => this.handleError(error))
    );
  }


  getNewsById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/news/new/${id}`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getGuideCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/guides/categories`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene las guías, opcionalmente filtradas por categoría
   */
  getGuides(categoryId?: number): Observable<any> {
    const params: any = {};
    if (categoryId) params.categoria = categoryId;
    return this.http.get<any>(`${this.apiUrl}/guides`, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene una guía por ID
   */
  getGuideById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/guides/guide/${id}`).pipe(
      catchError(error => this.handleError(error))
    );
  }


  /**
   * Restaura la sesión si existe un token válido
   */
  private restoreSession(): void {
    const token = this.getToken();
    const storedUser = this.getStoredUser();
    
    if (token && storedUser) {
      if (this.isTokenExpired(token)) {
        this.logout();
        return;
      }

      // Restaurar usuario desde localStorage inmediatamente
      this.authStatusSubject.next(true);
      this.currentUserSubject.next(storedUser);
      
      // Verificar que el token sea válido con el backend (sin desloguear si falla)
      this.getProfile().subscribe({
        next: (response) => {
          if (response.success) {
            // Token válido, actualizar datos si cambiaron
            this.currentUserSubject.next(this.normalizeUser(response.data));
          } else {
            // Token no válido, cerrar sesión
            this.logout();
          }
        },
        error: (error) => {
          if (error?.status === 401 || error?.status === 403) {
            this.logout();
            return;
          }

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
    return user ? this.normalizeUser(JSON.parse(user)) : null;
  }

  private normalizeUser(user: User | null | undefined): User {
    const normalized = (user ?? {}) as User & {
      rank?: number | string;
      rango?: number | string;
      module?: number | string;
    };
    const rankValue = Number(normalized.rango ?? normalized.rank ?? 0);
    const moduleValue = Number(normalized.module ?? 0);

    return {
      ...normalized,
      rango: Number.isNaN(rankValue) ? 0 : rankValue,
      rank: Number.isNaN(rankValue) ? 0 : rankValue,
      module: Number.isNaN(moduleValue) ? 0 : moduleValue,
    };
  }

  /**
   * Verifica si hay un token guardado
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return true;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalized));
      const exp = Number(decoded?.exp);

      if (!exp) {
        return false;
      }

      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
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
