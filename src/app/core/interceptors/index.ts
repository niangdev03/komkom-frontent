import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth-interceptor';
import { ServerErrorInterceptor } from './server-error.interceptor';
import { HttpsInterceptor } from './https-interceptor';

export const httpInterceptorProviders = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  },
  { provide: HTTP_INTERCEPTORS, useClass: HttpsInterceptor, multi: true },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ServerErrorInterceptor,
    multi: true
  }
];
