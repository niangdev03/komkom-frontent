import { inject, Injectable } from '@angular/core';

import {
  BehaviorSubject,
  Observable,
  tap,
  map,
  catchError,
  throwError,
  of
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangePassword } from 'src/app/interfaces/ChangePassword';
import { User } from 'src/app/interfaces/User';
import {
  CurrentUserAuth,
  AuthResponse,
  ResponseMessage,
  OtpAuthResponse
} from 'src/app/response-type/Type';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private user$ = new BehaviorSubject<CurrentUserAuth | null>(null);
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    this.checkAuthStatus().subscribe();
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials, {
        withCredentials: true
      })
      .pipe(
        tap((response) => {
          if (response.status === 'pending_otp') {
            this.router.navigate(['/otp']);
          } else if (response.status === true) {
            this.loadUser().subscribe();
          }
        })
      );
  }

  checkAuthStatus(): Observable<boolean> {
    return this.http
      .get<CurrentUserAuth>(`${this.apiUrl}/authenticate`, {
        withCredentials: true
      })
      .pipe(
        tap((response) => {
          this.currentUser$.next(response.user);
          this.isAuthenticatedSubject.next(!response.user.requires_otp);
        }),
        map((response) => !response.user.requires_otp),
        catchError(() => {
          // Ici, on échoue silencieusement car l'utilisateur n'est juste pas connecté
          this.currentUser$.next(null);
          this.isAuthenticatedSubject.next(false);
          return of(false);
        })
      );
  }

  verifyOtp(data: { email: string; otp: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/verify-otp`, data, {
        withCredentials: true
      })
      .pipe(
        tap((response) => {
          if (response.status === true) {
            // Une fois l'OTP vérifié, on met à jour le statut d'authentification
            this.loadUser().subscribe();
            this.isAuthenticatedSubject.next(true);
            // this.router.navigate(['/index']); // Redirection vers l'index
          }
        }),
        catchError(this.handleError)
      );
  }

  changePassword(
    userId: number,
    data: ChangePassword
  ): Observable<ResponseMessage> {
    return this.http.put<ResponseMessage>(
      `${this.apiUrl}/change-password/${userId}`,
      data
    );
  }

  logout(): Observable<ResponseMessage> {
    return this.http
      .post<ResponseMessage>(
        `${this.apiUrl}/logout`,
        {},
        {
          withCredentials: true
        }
      )
      .pipe(
        tap(() => {
          this.clearCookies();
          this.currentUser$.next(null);
          this.isAuthenticatedSubject.next(false);
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    return throwError(() => new Error(errorMessage));
  }

  getUser(): Observable<CurrentUserAuth> {
    return this.http
      .get<CurrentUserAuth>(`${this.apiUrl}/authenticate`, {
        withCredentials: true
      })
      .pipe(
        tap((user) => this.user$.next(user)),
        catchError((error) => {
          this.user$.next(null);
          return throwError(() => error);
        })
      );
  }

  checkOtp(email: string | null) {
    return this.http
      .post<OtpAuthResponse>(
        `${this.apiUrl}/check-otp`,
        { email },
        {
          withCredentials: true
        }
      )
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  private clearCookies(): void {
    document.cookie = 'jwt=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;';
  }

  private loadUser() {
    return this.http
      .get<CurrentUserAuth>(`${this.apiUrl}/authenticate`, {
        withCredentials: true
      })
      .pipe(
        tap((currentUserAuth) => {
          this.currentUser$.next(currentUserAuth.user);
          this.isAuthenticatedSubject.next(true);
          switch (currentUserAuth.user.role.name) {
            case 'Admin':
              this.router.navigate(['/index/admin/company/list']);
              break;
            case 'Owner':
              this.router.navigate(['/index/owner/stores']);
              break;
            case 'manager':
            case 'seller':
              this.router.navigate(['/index/manager/home']);
              break;
            default:
              break;
          }
        }),
        catchError((error) => {
          this.currentUser$.next(null);
          this.isAuthenticatedSubject.next(false);
          return throwError(() => error);
        })
      );
  }

  forgotPassword(email: string): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(`${this.apiUrl}/forgot-password`, {
      email
    });
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.apiUrl}/reset-password`,
      data
    );
  }

  getCurrentUserSync(): User | null {
    return this.currentUser$.getValue();
  }

  getUserAuth(): Observable<CurrentUserAuth> {
    return this.http.get<CurrentUserAuth>(`${this.apiUrl}/authenticate`, {
      withCredentials: true
    });
  }
}
