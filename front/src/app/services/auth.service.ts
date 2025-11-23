import { inject, Injectable } from '@angular/core';
import { UserService } from './user.service';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { NewUser, User } from '../interfaces';
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
    private readySubject = new BehaviorSubject(false);

    updateCurrentUser(user: User | null): void {
        this.authStore.setCurrentUser(user);
    }

    initUserSession$() {
        const username = localStorage.getItem('currentUser');
        if (!username) {
            this.readySubject.next(true);
            return of(null);
        }

        return this.userService.getUserByUsername(username).pipe(
            tap(user => {
                if (user) this.authStore.setCurrentUser(user);
                this.readySubject.next(true);
            }),
            catchError(err => {
                localStorage.removeItem('currentUser');
                this.readySubject.next(true);
                return of(null);
            })
        );
    }

    login(credentials: Pick<User, 'username' | 'password'>): Observable<User> {
        return this.userService.login(credentials).pipe(
            tap((user) => {
                this.updateCurrentUser(user);
                localStorage.setItem('currentUser', user.username);
            }),
            catchError((err) => {
                const error = err.error.error;
                return throwError(() => error);
            })
        );
    }

    signup(newUser: NewUser): Observable<User | null> {
        return this.userService.addUser(newUser).pipe(
            tap((user) => {
                if (user) {
                    this.updateCurrentUser(user);
                    localStorage.setItem('currentUser', user.username);
                }
            }),
            catchError((err) => {
                const error = err.error;
                return throwError(() => error);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('currentUser');
        this.updateCurrentUser(null);
        this.router.navigate(['/login']).then(() => {
            this.toastService.show('Logged out successfully', 'info');
        });
    }
}
