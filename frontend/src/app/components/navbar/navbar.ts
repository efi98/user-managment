import {Component, ElementRef, HostListener, inject, Signal} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '@services/auth.service';
import {RouteStateService} from '@services/route-state.service';
import {User} from "@interfaces";
import {AuthStore} from "@store/auth.store";
import {BASE_URL, MESSAGES} from "@consts";

const ROUTE_TITLES: Record<string, string> = {
    '': $localize`:@@navbarHomePage:Home page`,
    'admin-panel': $localize`:@@navbarAdminPanel:Admin Panel`,
    settings: $localize`:@@navbarSettings:Settings`,
    login: $localize`:@@loginTitle:Login`,
    signup: $localize`:@@signupTitle:Sign Up`,
};

@Component({
    selector: 'app-navbar',
    imports: [],
    templateUrl: './navbar.html',
    styleUrls: ['./navbar.scss'],
})
export class Navbar {
    router = inject(Router);
    authService = inject(AuthService);
    routeState = inject(RouteStateService);
    authStore = inject(AuthStore);
    isLoggedIn = this.authService.isLoggedIn;
    isAdmin = this.authService.isAdmin;
    isServerDown = this.authStore.isServerDown;
    selectedUser: Signal<User | null> = this.authStore.selectedUser;
    currentUser: Signal<User | null> = this.authStore.currentUser;
    selectedDisplayName = this.authStore.selectedDisplayName;
    showUserDropdown = false;
    private readonly elementRef = inject(ElementRef);
    protected errorMessage = MESSAGES.SERVER_DOWN;

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.closeUserDropdown();
        }
    }

    getCurrentRouteTitle(): string {
        const path = this.routeState.currentRouteUrl().split('?')[0].replace(/^\//, '').split('/')[0];
        return ROUTE_TITLES[path] ?? '';
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
            const username = this.selectedUser()?.username ?? '';
            if (this.authStore.isSelectedIsCurrent()) {
                return $localize`:@@navbarEditSelf:Edit '${username}' (YOU)`;
            }
            return $localize`:@@navbarEditOther:Edit '${username}'`;
        }
        return this.getCurrentRouteTitle();
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

    protected getAvatarUrl(avatar: any) {
        return `${BASE_URL}${avatar}`;
    }
}
