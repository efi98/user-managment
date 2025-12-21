import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from "../services/user.service";
import { take } from "rxjs/operators";
import { catchError, map, of } from "rxjs";
import { AuthStore } from "../store/auth.store";

export const UserGuard: CanActivateFn = (route, state) => {
    const userService = inject(UserService);
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (state.url.startsWith('/admin-panel/')) {
        const username = route.paramMap.get('username');
        if (username) {
            return userService.getUserByUsername(username).pipe(
                take(1),
                map(user => {
                    authStore.setSelectedUser(user!);
                    return user ? true : router.createUrlTree(['/admin-panel']);
                }),
                catchError(() => of(router.createUrlTree(['/admin-panel'])))
            );
        }
    }

    return true;
};
