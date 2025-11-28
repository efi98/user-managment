import { inject, Injectable } from '@angular/core';
import { UserService } from './user.service';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { NewUser, ToastSeverity, User, UserResponse } from '../interfaces';
import { Router } from '@angular/router';
import { AuthStore } from '../store/auth.store';
import { ToastService } from "./toast.service";

@Injectable({providedIn: 'root'})
export class AuthService {
    private userService = inject(UserService);
    private router = inject(Router);
    private authStore = inject(AuthStore);
    readonly currentUser = this.authStore.currentUser;
    readonly isLoggedIn = this.authStore.isLoggedIn;
    readonly isAdmin = this.authStore.isAdmin;
    private toastService = inject(ToastService);
    private sessionExpiryTimeoutId: any = null;

    /**
     * Checks session by calling userService.me(). Updates AuthStore and redirects to /login if not logged in.
     */
    initUserSession$(): Observable<User | null> {
        return this.userService.me().pipe(
            tap((res) => {
                const {user, sessionExpiresAt} = res ?? {};
                if (user) {
                    this.handleAuthSuccess({user, sessionExpiresAt});
                } else {
                    //todo unify error handling
                    this.authStore.setCurrentUser(null);
                    this.clearSessionExpiryTimer();
                    this.router.navigate(['/login']);
                }
            }),
            map(res => res?.user ?? null),
            catchError(() => {
                this.authStore.setCurrentUser(null);
                this.clearSessionExpiryTimer();
                this.router.navigate(['/login']);
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
            map(res => this.handleAuthSuccess(res)),
            catchError((err) => {
                const error = err.error?.error || 'Login failed';
                return throwError(() => error);
            })
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
                const error = err.error?.error || 'Signup failed';
                return throwError(() => error);
            })
        );
    }

    /**
     * Manual logout (user clicked Logout).
     * Sends request to backend to destroy session, then logs out locally.
     */
    logout(): void {
        this.userService.logout().subscribe({
            next: () => this.finishLogout({message: 'Logged out successfully'}),
            error: () => this.finishLogout({message: 'Logged out successfully'})
        });
    }

    /**
     * Session expired (401 from server, or automatic idle timeout).
     * Do NOT show toast if there is no user in store.
     */
    sessionExpiredLogout(): void {
        if (!this.authStore.isLoggedIn()) {
            // Already not logged in (e.g. after refresh) → just ensure /login, no toast.
            this.router.navigate(['/login']);
            return;
        }

        const toastOptions: { message: string, severity: ToastSeverity } = {
            message: 'Your session has expired. Please log in again.',
            severity: 'warning'
        };
        this.finishLogout(toastOptions);
    }

    /**
     * Common logout cleanup: clear user, clear timer, navigate, show toast (if relevant).
     */
    private finishLogout(toastOptions: { message: string, severity?: ToastSeverity }): void {
        const {message, severity = 'info'} = toastOptions;

        const wasLoggedIn = this.authStore.isLoggedIn();

        // Clear store and timer regardless
        this.authStore.setCurrentUser(null);
        this.clearSessionExpiryTimer();

        // If user was not logged in, no toast; but we still navigate to /login.
        if (!wasLoggedIn) {
            this.router.navigate(['/login']);
            return;
        }

        this.router.navigate(['/login']).then(() => {
            this.toastService.show(message, severity);
        });
    }

    /**
     * Schedule automatic session expiration logout based on absolute timestamp (ms).
     * If expiresAt is in the past, logout immediately.
     */
    // todo move
    private scheduleSessionExpiry(expiresAt?: number | null): void {
        this.clearSessionExpiryTimer();

        if (!expiresAt) {
            return;
        }

        const diff = expiresAt - Date.now();

        if (diff <= 0) {
            this.sessionExpiredLogout();
            return;
        }

        this.sessionExpiryTimeoutId = setTimeout(() => {
            this.sessionExpiryTimeoutId = null;
            this.sessionExpiredLogout();
        }, diff);
    }

    /**
     * Clears any existing automatic session-expiry timer.
     */
    private clearSessionExpiryTimer(): void {
        if (this.sessionExpiryTimeoutId) {
            clearTimeout(this.sessionExpiryTimeoutId);
            this.sessionExpiryTimeoutId = null;
        }
    }

    private handleAuthSuccess(res: UserResponse): User {
        const {user, sessionExpiresAt} = res;
        this.authStore.setCurrentUser(user);
        if (sessionExpiresAt) {
            this.scheduleSessionExpiry(sessionExpiresAt);
        }
        return user;
    }
}
