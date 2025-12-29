import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  requiredOtp:boolean=false;

  canActivate(): Observable<boolean> {
    return this.authService.checkAuthStatus().pipe(
      map((response) => {
        if (response ) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
