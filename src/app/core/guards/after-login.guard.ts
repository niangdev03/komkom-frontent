import { inject, Injectable } from '@angular/core';
import { CanActivate, UrlTree, Router } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AfterLoginGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.checkAuthStatus().pipe(
      switchMap((isAuthenticated) => {
        if (isAuthenticated) {
          return this.authService.getCurrentUser().pipe(
            map((user) => {
              if (user) {
                const roleName = user.role?.name?.toLowerCase();
                if (roleName === 'owner') {
                  return this.router.createUrlTree(['/index/owner/stores']);
                } else if (roleName === 'manager' || roleName === 'seller') {
                  return this.router.createUrlTree(['/index/manager/home']);
                } else {
                  return this.router.createUrlTree(['/index/admin/company/list']);
                }
              }
              return this.router.createUrlTree(['/index']);
            })
          );
        }
        return new Observable<boolean>((observer) => {
          observer.next(true);
          observer.complete();
        });
      })
    );
  }
}
