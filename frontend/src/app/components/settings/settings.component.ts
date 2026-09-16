import {Component, computed, inject, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {filter, finalize} from 'rxjs';
import {MESSAGES} from '@consts';
import {UserCardComponent} from '@components/user-card/user-card.component';
import {Severity, UpdatedUser, User, UserFormConfig} from '@interfaces';
import {AuthService} from '@services/auth.service';
import {DialogService} from '@services/dialog.service';
import {ToastService} from '@services/toast.service';
import {UserService} from '@services/user.service';
import {AuthStore} from '@store/auth.store';
import {take} from "rxjs/operators";

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    imports: [UserCardComponent],
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
    loading = signal(false);
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
        submitLabel: $localize`:@@settingsSubmit:Save`,
        editLabel: $localize`:@@settingsEdit:Edit`,
        deleteLabel: $localize`:@@settingsDelete:Delete`,
        emptyLabel: $localize`:@@settingsEmpty:EMPTY`,
    };
    private readonly userService = inject(UserService);
    private readonly authService = inject(AuthService);
    private readonly authStore = inject(AuthStore);
    private readonly dialogService = inject(DialogService);
    private readonly toastService = inject(ToastService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    activeUser = this.authStore.activeUser;
    protected header = computed(() => {
        const username = this.route.snapshot.paramMap.get('username');

        if (username) {
            return $localize`:@@settingsUserDetails: '${username}' Details`;
        }
        return $localize`:@@settingsHeader:User Settings`;
    });

    onSubmitted(payload: Partial<User>) {
        this.loading.set(true);
        const user = this.activeUser();
        if (!user) return;

        this.userService.updateUser(user.username, payload as UpdatedUser).pipe(
            finalize(() => {
                this.loading.set(false);
            })
        ).subscribe({
            next: (updatedUser) => {
                if (!updatedUser) return;
                this.updateActiveUser(updatedUser);

                this.toastService.show(MESSAGES.USER_UPDATED, Severity.Success);
            },
            error: (err) => {
                this.toastService.show(err, Severity.Error);
            }
        });
    }

    onAvatarChanged(file: File) {
        const user = this.activeUser();
        if (!user) return;

        this.loading.set(true);
        this.userService.uploadAvatar(user.username, file).pipe(
            finalize(() => {
                this.loading.set(false);
            })
        ).subscribe({
            next: ({avatar}) => {
                this.updateActiveUser({...user, avatar});
                this.toastService.show(MESSAGES.AVATAR_UPDATED, Severity.Success);
            },
            error: (err) => {
                this.toastService.show(err, Severity.Error);
            }
        });
    }

    onAvatarDeleted() {
        const user = this.activeUser();
        if (!user) return;

        this.loading.set(true);
        this.userService.deleteAvatar(user.username).pipe(
            finalize(() => {
                this.loading.set(false);
            })
        ).subscribe({
            next: () => {
                this.updateActiveUser({...user, avatar: '/uploads/avatars/default.jpg'});
                this.toastService.show(MESSAGES.AVATAR_DELETED, Severity.Success);
            },
            error: (err) => {
                this.toastService.show(err, Severity.Error);
            }
        });
    }

    onDeleted() {
        const user = this.activeUser();
        if (!user) return;

        const isForeignSelectedUser = !!this.authStore.selectedUser() && !this.authStore.isSelectedIsCurrent();
        const message = isForeignSelectedUser
            ? $localize`:@@settingsDeleteOther:You are about to delete user: <b>'${user.username}'</b>.<br> Are you sure you want to continue?`
            : $localize`:@@settingsDeleteSelf:You are about to delete your account.<br> Are you sure you want to continue?`;

        this.dialogService.show(message);

        this.dialogService.action$.pipe(
            filter((confirmed: boolean) => confirmed),
            take(1)
        ).subscribe(() => {
            this.userService.deleteUser(user.username).subscribe({
                next: () => {
                    this.toastService.show(MESSAGES.USER_DELETED, Severity.Success);

                    if (isForeignSelectedUser) {
                        this.authStore.setSelectedUser(null);
                        this.router.navigate(['/admin-panel']);
                    } else {
                        this.authStore.setCurrentUser(null);
                        this.authService.logout();
                        this.router.navigate(['/login']);
                    }
                },
                error: (err) => {
                    this.toastService.show(err, Severity.Error);
                }
            });
        });
    }

    onCancelled() {
        this.toastService.show(MESSAGES.CHANGES_CANCELLED, Severity.Info);
    }

    private updateActiveUser(user: User) {
        this.authStore.updateUser(user);
    }
}
