import {inject, Injectable} from '@angular/core';
import {UserService} from './user.service';
import {
    catchError,
    exhaustMap,
    filter,
    finalize,
    map,
    Observable,
    of,
    Subscription,
    switchMap,
    tap,
    throwError,
    timer
} from 'rxjs';
import {NewUser, Severity, ToastSeverity, User} from '@interfaces';
import {Router} from '@angular/router';
import {AuthStore} from '@store/auth.store';
import {ToastService} from "./toast.service";
import {MESSAGES} from "@consts";
import {HttpErrorResponse} from "@angular/common/http";

@Injectable({providedIn: 'root'})
export class AuthService {
    private static readonly SERVER_RETRY_INTERVAL_MS = 2_000;
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);
    private readonly authStore = inject(AuthStore);
    readonly isLoggedIn = this.authStore.isLoggedIn;
    readonly isAdmin = this.authStore.isAdmin;
    private readonly toastService = inject(ToastService);
    private serverRecoverySubscription?: Subscription;

    /**
     * Checks session by calling userService.me(). Updates AuthStore and redirects to /login if not logged in.
     */
    initUserSession$(): Observable<User | null> {
        return this.userService.me().pipe(
            tap((res) => {
                this.handleAuthSuccess(res);
            }),
            catchError((err) => {
                this.handleAuthFailure(err);
                return of(null);
            })
        );
    }

    /**
     * Calls userService.login, updates AuthStore with returned user
     * and schedules automatic session expiry.
     *
     * Expected response shape: { user: User; sessionExpiresAt: number }
     */
    login(credentials: Pick<User, 'username' | 'password'>): Observable<User> {
        return this.userService.login(credentials).pipe(
            map(res => this.handleAuthSuccess(res))
        );
    }

    /**
     * Calls userService.addUser to sign up, then sets current user.
     * (Optional) You can extend this to also return sessionExpiresAt and call scheduleSessionExpiry.
     */
    signup(newUser: NewUser): Observable<User | null> {
        return this.userService.addUser(newUser).pipe(
            switchMap((createdUser) => {
                if (!createdUser) return of(null);

                return this.userService.login({
                    username: newUser.username,
                    password: newUser.password
                }).pipe(
                    map(res => this.handleAuthSuccess(res))
                );
            }),
            catchError((err) => {
                this.authStore.setUsernameSuggestions(err.suggestions);
                return throwError(() => err.message);
            })
        );
    }

    /**
     * Manual logout (user clicked Logout).
     * Sends request to backend to destroy session, then logs out locally.
     */
    logout(): void {
        this.userService.logout().pipe(finalize(() => {
            this.finishLogout({message: MESSAGES.LOGOUT_SUCCESS});
        })).subscribe();
    }

    /**
     * Session expired (401 from server, or automatic idle timeout).
     * Do NOT show toast if there is no user in store.
     */
    sessionExpiredLogout(): void {
        const toastOptions: { message: string, severity: ToastSeverity } = {
            message: MESSAGES.SESSION_EXPIRED,
            severity: Severity.Warning
        };
        this.finishLogout(toastOptions);
    }

    private finishLogout(toastOptions: { message: string, severity?: ToastSeverity }): void {
        const {message, severity = Severity.Info} = toastOptions;

        this.stopServerRecoveryMonitor();
        this.authStore.setCurrentUser(null);
        this.authStore.setSelectedUser(null);

        this.router.navigate(['/login']).then(() => {
            this.toastService.show(message, severity);
        });
    }

    private handleAuthSuccess(res: User): User {
        this.authStore.setCurrentUser(res);
        this.stopServerRecoveryMonitor();
        return res;
    }

    private handleAuthFailure(err: HttpErrorResponse): void {
        this.authStore.setCurrentUser(null);

        const toastObj = {message: MESSAGES.NOT_LOGGED_IN, severity: Severity.Warning};
        this.router.navigate(['/login']).then(() => {
            if (!this.authStore.isServerDown()) {
                this.toastService.show(toastObj.message, toastObj.severity);
            }
        });
    }

    startServerRecoveryMonitor(): void {
        if (this.serverRecoverySubscription) {
            return;
        }

        this.serverRecoverySubscription = timer(0, AuthService.SERVER_RETRY_INTERVAL_MS).pipe(
            filter(() => this.authStore.isServerDown()),
            exhaustMap(() => this.userService.me().pipe(
                tap(user => this.handleAuthSuccess(user)),
                // A non-network response, including 401, proves the server is back. A 401 for
                // an authenticated user is handled by AuthInterceptor.
                catchError(() => {
                    if (!this.authStore.isServerDown()) {
                        this.stopServerRecoveryMonitor();
                    }
                    return of(null);
                }),
            )),
        ).subscribe();
    }

    stopServerRecoveryMonitor(): void {
        this.serverRecoverySubscription?.unsubscribe();
        this.serverRecoverySubscription = undefined;
    }
}
