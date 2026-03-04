import {Component, computed, effect, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Mode, PasswordValidation, User} from '@interfaces';
import {GENDERS_LIST} from '@consts';
import {UserService} from '@services/user.service';
import {AuthService} from '@services/auth.service';
import {Router} from '@angular/router';
import {PasswordStrengthComponent} from '@components/password-strength/password-strength';
import {PasswordPolicyService} from '@services/password-policy.service';
import {passwordValidatorFactory} from '@utils/validators';
import {getRelativeTime} from '@utils/utilities';
import {AuthStore} from '@store/auth.store';
import {DialogService} from "@services/dialog.service";
import {filter} from "rxjs";
import {ToastService} from '@services/toast.service';

@Component({
    selector: 'app-user-card',
    imports: [CommonModule, ReactiveFormsModule, PasswordStrengthComponent],
    templateUrl: './user-card.component.html',
    styleUrls: ['./user-card.component.scss'],
})
export class UserCardComponent {
    mode: Mode = Mode.View;
    userForm: FormGroup<{
        username: FormControl<string | null>;
        displayName: FormControl<string | null>;
        password: FormControl<string | null>;
        birthdate: FormControl<string | null>;
        gender: FormControl<string | null>;
        isAdmin: FormControl<boolean | null>;
    }>;
    fb = inject(FormBuilder);
    userService = inject(UserService);
    authService = inject(AuthService);
    router = inject(Router);
    passwordPolicyService = inject(PasswordPolicyService);
    authStore = inject(AuthStore);
    dialogService = inject(DialogService);
    toastService = inject(ToastService);
    passwordValidationResult!: PasswordValidation;
    currentUser: Signal<User | null> = this.authStore.currentUser;
    selectedUser: Signal<User | null> = this.authStore.selectedUser;
    user = computed(() => this.selectedUser() || this.currentUser());
    createdRelative = computed(() => getRelativeTime(this.user()!.createdAt));
    updatedRelative = computed(() => {
        let createdAt = this.user()!.createdAt;
        let updatedAt = this.user()!.updatedAt;
        if (updatedAt.getTime() !== createdAt.getTime()) {
            return getRelativeTime(this.user()!.updatedAt);
        }
        return '';
    });
    protected readonly GENDERS_LIST = GENDERS_LIST;
    protected readonly Mode = Mode;

    constructor() {
        this.userForm = this.fb.group({
            username: [''],
            displayName: [''],
            password: [
                '',
                [
                    passwordValidatorFactory(this.passwordPolicyService, (result) => {
                        this.passwordValidationResult = result;
                    }),
                ],
            ],
            birthdate: new FormControl<string | null>(null, []),
            gender: [''],
            isAdmin: [false],
        });

        effect(() => {
            const user = this.user();
            if (user) {
                // prepare patch with only fields that exist on the form
                const formattedBirthdate = this.formatBirthdateForInput(user.birthdate);
                const patch: any = {
                    username: user.username,
                    displayName: user.displayName ?? null,
                    birthdate: formattedBirthdate,
                    gender: user.gender ?? null,
                    isAdmin: user.isAdmin ?? false,
                };
                this.userForm.patchValue(patch);
            }
        });
    }

    get isSaveDisabled(): boolean {
        if (!this.userForm.dirty || this.userForm.invalid) {
            return true;
        }

        const controls = this.userForm.controls;
        for (const key in controls) {
            if (controls.hasOwnProperty(key)) {
                const control = controls[key as keyof typeof controls];
                if (control.dirty && (control.value === '' || control.value === null)) {
                    // A field is dirty and has been emptied
                    return true;
                }
            }
        }

        return false;
    }

    // make public so template can call it
    public computeAgeFromBirthdate = (birthdate?: string | Date | null): number | null => {
        if (!birthdate) return null;
        const b = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
        if (Number.isNaN(b.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - b.getFullYear();
        const m = today.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
        return Math.max(age, 0);
    }

    isEditRole(mode: Mode) {
        return (mode === Mode.Edit && (!!this.selectedUser() && !this.authStore.isSelectedIsCurrent()))
    }

    switchToEditMode() {
        this.mode = Mode.Edit;
    }

    save() {
        if (this.userForm.invalid) {
            return;
        }

        const updatedUser: Partial<User> = {};
        const controls = this.userForm.controls;
        Object.keys(controls).forEach((key) => {
            const control = controls[key as keyof typeof controls];
            if (control.dirty) {
                const controlValue = control.value;
                // Only include the value if it's not empty
                if (controlValue !== '' && controlValue !== null) {
                    (updatedUser as any)[key] = controlValue;
                }
            }
        });

        if (Object.keys(updatedUser).length === 0) {
            this.userForm.markAsPristine();
            return;
        }

        const user = this.user();
        if (!user) {
            return;
        }

        this.userService.updateUser(user.username, updatedUser).subscribe({
            next: (user) => {
                if (user) {
                    if (this.selectedUser()) {
                        this.authStore.setSelectedUser(user);
                    } else if (this.currentUser()) {
                        this.authStore.setCurrentUser(user);
                    }
                    this.mode = Mode.View;
                    this.userForm.markAsPristine();
                    this.toastService.show('User updated successfully', 'success');
                }
            },
            error: (err) => {
                this.toastService.show(`Update failed: ${err.message}`, 'error');
            }
        });
    }

    delete() {
        const user = this.user();
        let message = '';
        if (!user) {
            return;
        }
        if (this.selectedUser() && !this.authStore.isSelectedIsCurrent()) {
            message = `You are about to delete user: <b>'${user.username}'</b>`;
        } else {
            message = `You are about to delete your account`;
        }
        this.dialogService.show(message + '.<br> are you sure you want to continue?');
        this.dialogService.action$.pipe(
            filter((confirmed: boolean) => confirmed)
        ).subscribe(() => {
            this.userService.deleteUser(user.username).subscribe({
                next: () => {
                    this.toastService.show('User deleted successfully', 'success');
                    if (!(this.selectedUser() && !this.authStore.isSelectedIsCurrent())) {
                        this.authService.logout();
                        this.router.navigate(['/login']);
                    }
                },
                error: (err) => {
                    this.toastService.show(`Delete failed: ${err.message}`, 'error');
                }
            });
        });
    }

    cancel() {
        const user = this.user();
        if (!user) {
            return;
        }
        if (this.userForm.dirty) {
            this.toastService.show('Changes cancelled', 'info');
        }
        this.userForm.reset({
            username: user.username,
            displayName: user.displayName ?? null,
            birthdate: this.formatBirthdateForInput(user.birthdate),
            gender: user.gender ?? null,
            isAdmin: user.isAdmin ?? false,
        } as any);
        this.mode = Mode.View;
    }

    toggleRole() {
        if (this.isEditRole(this.mode)) {
            this.userForm.patchValue({isAdmin: !this.userForm.value.isAdmin});
            this.userForm.get('isAdmin')?.markAsDirty();
        }
    }

    private formatBirthdateForInput(birthdate?: string | Date | null): string | null {
        if (!birthdate) return null;
        const b = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
        if (Number.isNaN(b.getTime())) return null;
        // YYYY-MM-DD
        return b.toISOString().substring(0, 10);
    }
}
