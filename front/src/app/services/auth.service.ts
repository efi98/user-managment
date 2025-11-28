import { inject, Injectable } from '@angular/core';
import { UserService } from './user.service';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { NewUser, ToastSeverity, User } from '../interfaces';
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
    // private sessionExpiryTimeoutId: any = null;

    /**
     * Checks session by calling userService.me(). Updates AuthStore and redirects to /login if not logged in.
     */
    initUserSession$(): Observable<User | null> {
        return this.userService.me().pipe(
            tap(user => {
                if (user) {
                    this.authStore.setCurrentUser(user);
                } else {
                    this.authStore.setCurrentUser(null);
                    this.router.navigate(['/login']);
                }
            }),
            catchError(() => {
                this.authStore.setCurrentUser(null);
                this.router.navigate(['/login']);
                return of(null);
            })
        );
    }

    /**
     * Calls userService.login, updates AuthStore with returned user.
     */
    login(credentials: Pick<User, 'username' | 'password'>): Observable<User> {
        return this.userService.login(credentials).pipe(
            tap((user) => {
                this.authStore.setCurrentUser(user);
            }),
            catchError((err) => {
                const error = err.error?.error || 'Login failed';
                return throwError(() => error);
            })
        );
    }

    /**
     * Calls userService.addUser to sign up, then logs in the user by calling userService.me.
     */
    signup(newUser: NewUser): Observable<User | null> {
        return this.userService.addUser(newUser).pipe(
            tap((user) => {
                if (user) {
                    this.authStore.setCurrentUser(user);
                }
            }),
            catchError((err) => {
                const error = err.error?.error || 'Signup failed';
                return throwError(() => error);
            })
        );
    }

    logout(): void {
        this.userService.logout().subscribe({
            next: () => this.finishLogout({message: 'Logged out successfully'}),
            error: () => this.finishLogout({message: 'Logged out successfully'})
        });
    }

    sessionExpiredLogout(): void {
        const toastOptions: { message: string, severity: ToastSeverity } = {
            message: 'Your session has expired. Please log in again.',
            severity: 'warning'
        }
        this.finishLogout(toastOptions)
    }

    private finishLogout(toastOptions: { message: string, severity?: ToastSeverity }): void {
        const {message, severity = 'info'} = toastOptions;
        if (!this.authStore.isLoggedIn()) return;
        this.authStore.setCurrentUser(null);
        this.router.navigate(['/login']).then(() => {
            this.toastService.show(message, severity);
        });
    }
}
