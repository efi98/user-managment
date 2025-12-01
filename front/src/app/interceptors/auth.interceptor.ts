import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private authService = inject(AuthService);
    private sessionTimer: any = null;
    private readonly SESSION_TIMEOUT_MS = 1000 * 60 * 60; // 1 hour

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap(event => {
                if (event instanceof HttpResponse) {
                    console.log('[AuthInterceptor] Response intercepted:', event);
                    this.resetSessionTimer();
                }
            })
        );
    }

    private resetSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        this.sessionTimer = setTimeout(() => {
            this.authService.sessionExpiredLogout();
        }, this.SESSION_TIMEOUT_MS);
    }
}
