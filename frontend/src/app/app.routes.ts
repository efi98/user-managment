import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { SignupComponent } from "./components/signup/signup";
import { AdminPanelComponent } from "./components/admin-panel/admin-panel.component";
import { HomeComponent } from "./components/home/home.component";
import { UserCardComponent } from "./components/user-card/user-card.component";
import { SettingsComponent } from "./components/settings/settings.component";
import { adminGuard } from "./guards/admin-guard";
import { authGuard } from "./guards/auth-guard";
import { noAuthGuard } from "./guards/no-auth-guard";
import { UserGuard } from "./guards/user-guard";
import { statsResolver } from './guards/stats-resolver';

export const routes: Routes = [
    {path: '', component: HomeComponent, canActivate: [authGuard], resolve: { stats: statsResolver }},
    {path: 'login', component: LoginComponent, canActivate: [noAuthGuard]},
    {path: 'signup', component: SignupComponent, canActivate: [noAuthGuard]},
    {path: 'admin-panel', component: AdminPanelComponent, canActivate: [authGuard, adminGuard]},
    {path: 'admin-panel/:username', component: UserCardComponent, canActivate: [authGuard, adminGuard, UserGuard]},
    {path: 'settings', component: SettingsComponent, canActivate: [authGuard]},
    {path: '**', redirectTo: ''}
];
