import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { NewUser, UpdatedUser, User } from '../interfaces';
import { BASE_URL } from "../consts";
import { AuthStore } from "../store/auth.store";
import { ToastService } from "./toast.service";

@Injectable({providedIn: 'root'})
export class UserService {
    http = inject(HttpClient);
    private authStore = inject(AuthStore);
    private toastService = inject(ToastService);

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${BASE_URL}/users`).pipe(
            tap(users => {
                this.authStore.setUsers(users);
            }),
            catchError(error => {
                this.toastService.show('Error fetching users:' + (error.status === 0 ? ' Server Is Down' : ''), 'error');
                return of([]);
            })
        );
    }

    getUserByUsername(username: string): Observable<User | undefined> {
        return this.http.get<User>(`${BASE_URL}/users/${username}`).pipe(
            map(user => user),
            catchError(error => {
                return of(undefined);
            })
        );
    }

    addUser(user: NewUser): Observable<User | null> {
        return this.http.post<User>(`${BASE_URL}/users`, user);
    }

    updateUser(username: string, updates: UpdatedUser): Observable<User | null> {
        return this.http.patch<User>(`${BASE_URL}/users/${username}`, updates).pipe(
            catchError(error => {
                return of(null);
            })
        );
    }

    deleteUser(username: string): Observable<any> {
        return this.http.delete(`${BASE_URL}/users/${username}`).pipe(
            catchError(error => {
                return of(null);
            })
        );
    }

    login(credentials: Pick<User, 'username' | 'password'>): Observable<User> {
        return this.http.post<User>(`${BASE_URL}/login`, credentials);
    }
}
