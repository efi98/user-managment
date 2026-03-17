import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import {NewUser, Severity, UpdatedUser, User} from '@interfaces';
import { BASE_URL } from "@consts";
import { AuthStore } from "@store/auth.store";
import { ToastService } from "./toast.service";

@Injectable({providedIn: 'root'})
export class UserService {
    http = inject(HttpClient);
    private readonly authStore = inject(AuthStore);
    private readonly toastService = inject(ToastService);

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${BASE_URL}/users`, { withCredentials: true }).pipe(
            tap(users => {
                this.authStore.setUsers(users);
            }),
            catchError(error => {
                this.toastService.show(
                    error.error?.message,
                    Severity.Error
                );
                return of([]);
            })
        );
    }

    getUserByUsername(username: string): Observable<User | undefined> {
        return this.http.get<User>(`${BASE_URL}/users/${username}`, { withCredentials: true });
    }

    addUser(user: NewUser): Observable<User | null> {
        return this.http.post<User>(`${BASE_URL}/users`, user, { withCredentials: true });
    }

    updateUser(username: string, updates: UpdatedUser): Observable<User | null> {
        return this.http.patch<User>(`${BASE_URL}/users/${username}`, updates, { withCredentials: true });
    }

    deleteUser(username: string): Observable<any> {
        return this.http.delete(`${BASE_URL}/users/${username}`, { withCredentials: true });
    }

    /**
     * Calls /login to authenticate and start a session.
     * Expected response: { user: User; sessionExpiresAt: number }
     */
    login(credentials: Pick<User, 'username' | 'password'>): Observable<User> {
        return this.http.post<User>(`${BASE_URL}/login`, credentials, { withCredentials: true });
    }

    /**
     * Calls /me to get current session user.
     * Expected response: { user: User | null; sessionExpiresAt?: number }
     * Returns null on error.
     */
    me(): Observable<User> {
        return this.http.get<User>(`${BASE_URL}/me`, { withCredentials: true });
    }

    /**
     * Calls /logout to end the session.
     */
    logout(): Observable<void> {
        return this.http.post<void>(`${BASE_URL}/logout`, {}, { withCredentials: true });
    }

    getStats(): Observable<any> {
        return this.http.get<any>(`${BASE_URL}/users/stats`, { withCredentials: true });
    }
}
