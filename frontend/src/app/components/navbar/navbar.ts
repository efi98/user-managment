import { Component, inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { User } from "../../interfaces";
import { AuthStore } from "../../store/auth.store";

@Component({
    selector: 'app-navbar',
    imports: [],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    router = inject(Router);
    authService = inject(AuthService);
    authStore = inject(AuthStore);

    isLoggedIn = this.authService.isLoggedIn;
    isAdmin = this.authService.isAdmin;
    selectedUser: Signal<User | null> = this.authStore.selectedUser;

    isInAdminPanel(): boolean {
        return this.router.url === '/admin-panel';
    }

    logout() {
        this.authService.logout();
    }

    navigate(path: string) {
        this.authStore.setSelectedUser(null);
        this.router.navigate([path]);
    }

    getTitleName() {
        if (!this.isInAdminPanel()) {
            if (this.selectedUser()) {
                let title = `Edit '${this.selectedUser()?.username}'`;
                if (this.authStore.isSelectedIsCurrent()) {
                    title += ' (YOU)';
                }
                return title;
            } else {
                return 'User Dashboard';
            }
        } else {
            return 'Admin Panel'
        }
    }
}
