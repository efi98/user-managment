import { Component, ElementRef, HostListener, inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
    showUserDropdown = false;
    private readonly elementRef = inject(ElementRef);

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.closeUserDropdown();
        }
    }

    getCurrentRouteTitle(): string {
        const path = this.router.url.split('?')[0].replace(/^\//, '').split('/')[0];
        if (!path) return 'Home page';
        return path
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    logout() {
        this.authService.logout();
    }

    navigate(path: string) {
        this.authStore.setSelectedUser(null);
        this.router.navigate([path]);
    }

    getTitleName() {
        if (this.selectedUser()) {
            let title = `Edit '${this.selectedUser()?.username}'`;
            if (this.authStore.isSelectedIsCurrent()) {
                title += ' (YOU)';
            }
            return title;
        } else {
            return this.getCurrentRouteTitle();
        }
    }

    toggleUserDropdown() {
        this.showUserDropdown = !this.showUserDropdown;
    }

    closeUserDropdown() {
        this.showUserDropdown = false;
    }

    goToSettings() {
        this.closeUserDropdown();
        this.navigate('/settings');
    }
}
