import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SessionTimer } from "../services/session-timer";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private authService = inject(AuthService);
    private sessionTimerService = inject(SessionTimer);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap(event => {
                if (event instanceof HttpResponse) {
                    this.sessionTimerService.resetSessionTimer(() => {
                        this.authService.sessionExpiredLogout();
                    });
                }
            }),
            catchError(error => {
                console.error('[AuthInterceptor] Error intercepted:', error);
                if (error.status === 401) {
                    this.authService.sessionExpiredLogout();
                }
                throw error;
            })
        );
    }
}
