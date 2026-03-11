import {Component, computed, inject} from '@angular/core';
import {Router} from '@angular/router';
import {filter} from 'rxjs';
import {MESSAGES} from '@consts';
import {UserCardComponent} from '@components/user-card/user-card.component';
import {Severity, UpdatedUser, User, UserFormConfig} from '@interfaces';
import {AuthService} from '@services/auth.service';
import {DialogService} from '@services/dialog.service';
import {ToastService} from '@services/toast.service';
import {UserService} from '@services/user.service';
import {AuthStore} from '@store/auth.store';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    imports: [UserCardComponent],
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
    formConfig: UserFormConfig = {
        visibleFields: ['username', 'displayName', 'password', 'birthdate', 'gender', 'isAdmin'],
        requiredFields: [],
        readonlyFields: ['username'],
        editable: true,
        canToggleEdit: true,
        startInEditMode: false,
        showMeta: true,
        showDelete: true,
        showCancel: true,
        emitOnlyDirtyFields: true,
        submitLabel: 'Save',
        editLabel: 'Edit',
        deleteLabel: 'Delete',
        emptyLabel: 'EMPTY',
    };
    private readonly userService = inject(UserService);
    private readonly authService = inject(AuthService);
    private readonly authStore = inject(AuthStore);
    user = this.authStore.activeUser;
    private readonly dialogService = inject(DialogService);
    private readonly toastService = inject(ToastService);
    private readonly router = inject(Router);

    onSubmitted(payload: Partial<User>) {
        const user = this.user();
        if (!user) return;

        this.userService.updateUser(user.username, payload as UpdatedUser).subscribe({
            next: (updatedUser) => {
                if (!updatedUser) return;

                if (this.authStore.selectedUser()) {
                    this.authStore.setSelectedUser(updatedUser);
                } else {
                    this.authStore.setCurrentUser(updatedUser);
                }

                this.toastService.show(MESSAGES.USER_UPDATED, Severity.Success);
            },
            error: (err) => {
                this.toastService.show(err.error.message, Severity.Error);
            }
        });
    }

    onDeleted() {
        const user = this.user();
        if (!user) return;

        const isForeignSelectedUser = !!this.authStore.selectedUser() && !this.authStore.isSelectedIsCurrent();
        const message = isForeignSelectedUser
            ? `You are about to delete user: <b>'${user.username}'</b>.<br> are you sure you want to continue?`
            : `You are about to delete your account.<br> are you sure you want to continue?`;

        this.dialogService.show(message);

        this.dialogService.action$.pipe(
            filter((confirmed: boolean) => confirmed)
        ).subscribe(() => {
            this.userService.deleteUser(user.username).subscribe({
                next: () => {
                    this.toastService.show(MESSAGES.USER_DELETED, Severity.Success);

                    if (isForeignSelectedUser) {
                        this.authStore.setSelectedUser(null);
                    } else {
                        this.authStore.setCurrentUser(null);
                        this.authService.logout();
                        this.router.navigate(['/login']);
                    }
                },
                error: (err) => {
                    this.toastService.show(err.error.message, Severity.Error);
                }
            });
        });
    }

    onCancelled() {
        this.toastService.show(MESSAGES.CHANGES_CANCELLED, Severity.Info);
    }
}