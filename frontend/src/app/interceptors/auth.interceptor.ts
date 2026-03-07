import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';
import { SessionTimerService } from "@services/session-timer.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly authService = inject(AuthService);
    private readonly sessionTimerService = inject(SessionTimerService);

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
                throw error;
            })
        );
    }
}
