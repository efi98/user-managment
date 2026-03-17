import {inject, Injectable} from '@angular/core';
import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {AuthService} from '@services/auth.service';
import {SessionTimerService} from "@services/session-timer.service";
import {Severity} from "@interfaces";
import {MESSAGES} from "@consts";
import {ToastService} from "@services/toast.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly authService = inject(AuthService);
    private readonly sessionTimerService = inject(SessionTimerService);
    private readonly toastService = inject(ToastService);

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
                if (error instanceof HttpErrorResponse && error.status === 0) {
                    this.toastService.show(MESSAGES.SERVER_DOWN, Severity.Error);
                }
                throw error;
            })
        );
    }
}
