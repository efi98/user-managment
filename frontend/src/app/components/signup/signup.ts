import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '@services/auth.service';
import {ToastService} from '@services/toast.service';
import {AuthStore} from "@store/auth.store";
import {UserCardComponent} from "@components/user-card/user-card.component";
import {NewUser, Severity, User, UserFormConfig, UserFormField} from "@interfaces";
import {finalize} from "rxjs";
import {MESSAGES} from "@consts";

@Component({
    selector: 'app-signup',
    imports: [RouterLink, UserCardComponent],
    templateUrl: './signup.html',
    styleUrl: './signup.scss'
})
export class SignupComponent {
    loading = false;
    formConfig: UserFormConfig = {
        visibleFields: ['username', 'displayName', 'password', 'birthdate', 'gender'],
        requiredFields: ['username', 'password'],
        readonlyFields: [],
        editable: true,
        canToggleEdit: false,
        startInEditMode: true,
        showMeta: false,
        showDelete: false,
        showCancel: false,
        emitOnlyDirtyFields: false,
        submitLabel: 'Sign Up',
        emptyLabel: 'EMPTY',
    };
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly authStore = inject(AuthStore);
    private readonly toastService = inject(ToastService);

    onSubmitted(payload: Partial<User>) {
        this.loading = true;

        this.authService.signup(payload as NewUser).pipe(
            finalize(() => {
                this.loading = false;
            })
        ).subscribe({
            next: (user) => {
                if (!user) return;
                this.toastService.show(MESSAGES.SIGNUP_SUCCESS, Severity.Success);
                this.router.navigateByUrl('/');
            },
            error: (err) => {
                this.toastService.show(err, Severity.Error);
            }
        });
    }

    onFieldValueChanged(event: { field: UserFormField; value: unknown }) {
        if (event.field === 'username') {
            this.authStore.setUsernameSuggestions([]);
        }
    }
}