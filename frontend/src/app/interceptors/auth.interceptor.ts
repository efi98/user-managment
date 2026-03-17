import {inject, Injectable} from '@angular/core';
import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {tap} from 'rxjs/operators';
import {AuthService} from '@services/auth.service';
import {SessionTimerService} from "@services/session-timer.service";
import {Severity} from "@interfaces";
import {MESSAGES} from "@consts";
import {ToastService} from "@services/toast.service";
import {AuthStore} from "@store/auth.store";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly authService = inject(AuthService);
    authStore = inject(AuthStore);
    private readonly sessionTimerService = inject(SessionTimerService);
    private readonly toastService = inject(ToastService);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap(event => {
                if (event instanceof HttpResponse) {
                    this.authStore.setIsServerDown(false);
                    this.sessionTimerService.resetSessionTimer(() => {
                        this.authService.sessionExpiredLogout();
                    });
                }
            }),
            catchError((error: HttpErrorResponse) => {
                const isServerDown = error.status === 0;
                let errorRes: any = 'Error';
                console.error('[AuthInterceptor] Error intercepted:', error);
                this.authStore.setIsServerDown(isServerDown);
                if (isServerDown) {
                    this.toastService.show(MESSAGES.SERVER_DOWN, Severity.Error);
                    errorRes = MESSAGES.SERVER_DOWN;
                } else if (error) {
                    errorRes = error.error.message;
                }
                if (error.status === 409) {
                    errorRes = {message: error.error.message, suggestions: error.error.suggestions};
                }

                return throwError(() => errorRes);
            })
        );
    }
}
