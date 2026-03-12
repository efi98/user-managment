import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AuthService} from '@services/auth.service';
import {ToastService} from '@services/toast.service';
import {Severity, User, UserFormConfig} from "@interfaces";
import {MESSAGES} from "@consts";
import {UserCardComponent} from "@components/user-card/user-card.component";
import {finalize} from "rxjs";

@Component({
    selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, UserCardComponent],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class LoginComponent {
    loading = signal(false);
    readonly formConfig: UserFormConfig = {
        visibleFields: ['username', 'password'],
        requiredFields: ['username', 'password'],
        readonlyFields: [],
        editable: true,
        canToggleEdit: false,
        startInEditMode: true,
        showMeta: false,
        showDelete: false,
        showCancel: false,
        emitOnlyDirtyFields: false,
        submitLabel: 'Login',
        hidePasswordStrength: true,
        validatePassword: false,
        showRequiredMarkers: false,
    };
    private readonly authService = inject(AuthService);
    private readonly toastService = inject(ToastService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    onSubmitted(payload: Partial<User>) {
        this.loading.set(true);
        const {username, password} = payload;

        this.authService.login({
            username: username!,
            password: password!,
        }).pipe(
            finalize(() => {
                this.loading.set(false);
            })
        ).subscribe({
            next: (user) => {
                if (!user) return;

                this.toastService.show(MESSAGES.LOGIN_SUCCESS, Severity.Success);
                const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
                this.router.navigateByUrl(returnUrl);
            },
            error: (err) => {
                this.toastService.show(err, Severity.Error);
            },
        });
    }
}
