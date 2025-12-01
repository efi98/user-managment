import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, Subscription, timer } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '@environments';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private authService = inject(AuthService);
    private sessionTimerSub: Subscription | null = null;
    private readonly SESSION_TIMEOUT_MS = environment.SessionTimeoutMs;

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
        if (this.sessionTimerSub) {
            this.sessionTimerSub.unsubscribe();
        }
        this.sessionTimerSub = timer(this.SESSION_TIMEOUT_MS).subscribe(() => {
            this.authService.sessionExpiredLogout();
        });
    }
}
