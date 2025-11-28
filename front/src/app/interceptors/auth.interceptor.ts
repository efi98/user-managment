import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private authService = inject(AuthService);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                console.log('[AuthInterceptor] Error intercepted:', error.status, error.message);
                if (error.status === 401) {
                    console.log('[AuthInterceptor] 401 detected, logging out...');
                    this.authService.sessionExpiredLogout();
                }
                return throwError(() => error);
            })
        );
    }
}
