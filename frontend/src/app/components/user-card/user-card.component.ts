import {CommonModule} from '@angular/common';
import {
    Component,
    computed,
    ElementRef,
    effect,
    EventEmitter,
    inject, input,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {BASE_URL, GENDERS_LIST} from '@consts';
import {PasswordValidation, User, UserFormConfig, UserFormField, UserFormModel} from '@interfaces';
import {PasswordStrengthComponent} from '@components/password-strength/password-strength';
import {PasswordPolicyService} from '@services/password-policy.service';
import {birthdateValidatorFactory, passwordValidatorFactory} from '@utils/validators';
import {computeAgeFromBirthdate, formatDateInput, getRelativeTime, yearsAgo} from '@utils/utilities';
import {toSignal} from "@angular/core/rxjs-interop";
import {AuthStore} from "@store/auth.store";
import {startWith} from "rxjs";

@Component({
    selector: 'app-user-card',
    imports: [CommonModule, ReactiveFormsModule, PasswordStrengthComponent],
    templateUrl: './user-card.component.html',
    styleUrls: ['./user-card.component.scss'],
})
export class UserCardComponent implements OnChanges {
    loading = input(false);
    @Input() config: UserFormConfig = {
        visibleFields: ['username', 'displayName', 'password', 'birthdate', 'gender'],
        requiredFields: [],
        readonlyFields: [],
        editable: true,
        canToggleEdit: false,
        startInEditMode: true,
        showMeta: false,
        showDelete: false,
        showCancel: false,
        emitOnlyDirtyFields: false,
        submitLabel: 'Save',
        editLabel: 'Edit',
        deleteLabel: 'Delete',
        emptyLabel: 'EMPTY',
        hidePasswordStrength: false,
        validatePassword: true,
        showRequiredMarkers: true,
    };

    @Output() submitted = new EventEmitter<Partial<User>>();
    @Output() cancelled = new EventEmitter<void>();
    @Output() deleted = new EventEmitter<void>();
    @Output() avatarChanged = new EventEmitter<File>();
    @Output() avatarDeleted = new EventEmitter<void>();
    @Output() fieldValueChanged = new EventEmitter<{ field: UserFormField; value: unknown }>();

    @ViewChild('avatarInput') private readonly avatarInput?: ElementRef<HTMLInputElement>;

    protected passwordValidationResult!: PasswordValidation;
    private isEditing = true;
    protected readonly GENDERS_LIST = GENDERS_LIST;
    private readonly defaultAvatarSuffix = '/uploads/avatars/default.jpg';
    private readonly fb = inject(FormBuilder);
    userForm: UserFormModel = this.fb.group({
        username: this.fb.control<string | null>(''),
        displayName: this.fb.control<string | null>(''),
        password: this.fb.control<string | null>(''),
        birthdate: this.fb.control<string | null>(null),
        gender: this.fb.control<string | null>(''),
        isAdmin: this.fb.control<boolean | null>(false),
    });

    private readonly passwordPolicyService = inject(PasswordPolicyService);
    private readonly authStore = inject(AuthStore);
    readonly usernameSuggestions = this.authStore.usernameSuggestions;
    private readonly usernameValue;
    protected readonly activeUser = this.authStore.activeUser;
    private waitingForLoadingStart = false;
    private waitingForLoadingEnd = false
    createdRelative = computed(() => {
        const activeUser = this.activeUser();
        if (!activeUser?.createdAt) return '';
        return getRelativeTime(this.toDate(activeUser.createdAt)!);
    });
    updatedRelative = computed(() => {
        const activeUser = this.activeUser();
        const createdAt = this.toDate(activeUser?.createdAt);
        const updatedAt = this.toDate(activeUser?.updatedAt);
        if (!createdAt || !updatedAt) return '';
        if (createdAt.getTime() === updatedAt.getTime()) return '';
        return getRelativeTime(updatedAt);
    });
    private initialFormValue: any;

    constructor() {
        this.usernameValue = toSignal(
            this.userForm.controls.username.valueChanges.pipe(
                startWith(this.userForm.controls.username.value ?? '')
            ),
            {
                initialValue: this.userForm.controls.username.value ?? ''
            }
        );

        effect(() => {
            const username = this.usernameValue();
            this.fieldValueChanged.emit({field: 'username', value: username});
            this.authStore.setUsernameSuggestions([]);
        });

        effect(() => {
            this.patchForm(this.authStore.activeUser());
        });

        effect(() => {
            const isLoading = this.loading();

            if (this.waitingForLoadingStart && isLoading) {
                this.waitingForLoadingStart = false;
                this.waitingForLoadingEnd = true;
                return;
            }

            if (this.waitingForLoadingEnd && !isLoading) {
                this.waitingForLoadingEnd = false;

                if (this.config.canToggleEdit) {
                    this.isEditing = false;
                }
            }
        });
    }

    getAvatarUrl(avatar?: string | null): string {
        return `${BASE_URL}${avatar}`;
    }

    get submitLabel(): string {
        return this.config.submitLabel!;
    }

    get canManageAvatar(): boolean {
        return this.config.editable !== false && this.isEditing;
    }

    get hasCustomAvatar(): boolean {
        const avatar = this.activeUser()?.avatar;
        return !avatar?.endsWith(this.defaultAvatarSuffix);
    }

    get editLabel(): string {
        return this.config.editLabel!;
    }

    get deleteLabel(): string {
        return this.config.deleteLabel!;
    }

    get emptyLabel(): string {
        return this.config.emptyLabel!;
    }

    get showActions(): boolean {
        return this.config.editable !== false && this.isEditing;
    }

    get canShowEditButton(): boolean {
        return this.config.editable !== false && !!this.config.canToggleEdit && !this.isEditing;
    }

    get isSubmitDisabled(): boolean {
        if (this.userForm.invalid) {
            return true;
        }
        const current: any = this.userForm.getRawValue();

        const hasRealChange = Object.keys(current).some(key => {
            return current[key] !== this.initialFormValue[key];
        });

        return !!(this.config.emitOnlyDirtyFields && !hasRealChange);
    }

    get minDate(): string {
        return formatDateInput(yearsAgo(120));
    }

    get maxDate(): string {
        return formatDateInput(yearsAgo(18));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config']) {
            this.applyConfig();
        }
    }

    isVisible(field: UserFormField): boolean {
        return this.config.visibleFields.includes(field);
    }

    isReadonly(field: UserFormField): boolean {
        return !!this.config.readonlyFields?.includes(field);
    }

    getError(field: UserFormField): string | null {
        const control = this.userForm.get(field);
        if (!control || !control.touched || !control.errors) {
            return null;
        }

        const errors = control.errors;
        if (errors['required']) {
            return `${field} is required.`;
        }

        if (errors['birthdate']) {
            return errors['birthdate'];
        }

        return 'Invalid value.';
    }

    canEditField(field: UserFormField): boolean {
        return this.config.editable !== false && this.isEditing && !this.isReadonly(field);
    }

    canEditRole(): boolean {
        return this.canEditField('isAdmin')
            && !!this.authStore.selectedUser()
            && !this.authStore.isSelectedIsCurrent();
    }

    isFieldRequired(field: UserFormField): boolean {
        return !!this.config.requiredFields?.includes(field);
    }

    displayValue(field: UserFormField): string {
        const raw = this.userForm.get(field)?.value;

        if (field === 'password') {
            return '******';
        }

        if (field === 'birthdate') {
            const formatted = this.formatBirthdateForInput(raw as string);
            return formatted || this.emptyLabel;
        }

        if (field === 'isAdmin') {
            return raw ? 'Admin' : 'User';
        }

        if (raw === null || raw === undefined || raw === '') {
            return this.emptyLabel;
        }

        return String(raw);
    }

    ageLabel(): string {
        const age = computeAgeFromBirthdate(this.userForm.get('birthdate')?.value);
        return age ? `${age}` : '';
    }

    isEmptyDisplay(field: UserFormField): boolean {
        return this.displayValue(field) === this.emptyLabel;
    }

    isInvalid(field: string): boolean {
        const control = this.userForm.get(field);
        return !!(control && control.touched && control.invalid);
    }

    shouldShowRequired(field: UserFormField): boolean {
        return this.config.showRequiredMarkers !== false && this.isFieldRequired(field);
    }

    switchToEditMode() {
        this.isEditing = true;
    }

    cancel() {
        if (this.userForm.dirty || this.userForm.touched) {
            this.cancelled.emit();
        }
        this.patchForm(this.authStore.activeUser());
    }

    toggleRole() {
        if (!this.canEditRole()) {
            return;
        }
        const current = !!this.userForm.get('isAdmin')?.value;
        this.userForm.patchValue({isAdmin: !current});
        this.userForm.get('isAdmin')?.markAsDirty();
        this.userForm.get('isAdmin')?.markAsTouched();
    }

    submit() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        const payload = this.buildSubmitPayload();

       this.waitingForLoadingStart = true;
        this.waitingForLoadingEnd = false;

        this.submitted.emit(payload);
    }

    openAvatarPicker() {
        if (!this.canManageAvatar || this.loading()) {
            return;
        }

        this.avatarInput?.nativeElement.click();
    }

    onAvatarFileSelected(event: Event) {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];

        if (!file) {
            return;
        }

        this.avatarChanged.emit(file);
        input.value = '';
    }

    removeAvatar() {
        if (!this.canManageAvatar || this.loading() || !this.hasCustomAvatar) {
            return;
        }

        this.avatarDeleted.emit();
    }

    private buildSubmitPayload(): Partial<User> {
        const payload: Partial<User> = {};
        const raw = this.userForm.getRawValue();

        for (const field of this.config.visibleFields) {
            if (!this.shouldIncludeField(field)) {
                continue;
            }

            const value = raw[field];
            const normalizedValue = this.normalizeFieldValue(field, value);

            if (normalizedValue !== undefined) {
                (payload as any)[field] = normalizedValue;
            }
        }

        return payload;
    }

    private shouldIncludeField(field: UserFormField): boolean {
        const control = this.userForm.get(field);
        if (!control) {
            return false;
        }
        return !(this.config.emitOnlyDirtyFields && !control.dirty);
    }

    private normalizeFieldValue(field: UserFormField, value: unknown): unknown {
        if (field === 'password' && !value) {
            return undefined;
        }

        if (this.isNullableEmptyField(field, value)) {
            return this.config.emitOnlyDirtyFields ? null : undefined;
        }

        if (value === '' || value === null || value === undefined) {
            return undefined;
        }

        return value;
    }

    private isNullableEmptyField(field: UserFormField, value: unknown): boolean {
        return ['birthdate', 'gender', 'displayName'].includes(field) && (value === '' || value === null);
    }

    private applyConfig() {
        this.isEditing = !!this.config.startInEditMode || !this.config.canToggleEdit;
        this.applyValidators();
    }

    private applyValidators() {
        const controls = this.userForm.controls;
        const allFields: UserFormField[] = ['username', 'displayName', 'password', 'birthdate', 'gender', 'isAdmin'];

        for (const field of allFields) {
            const validators = [];

            if (this.isFieldRequired(field)) {
                validators.push(Validators.required);
            }

            if (field === 'password' && this.config.validatePassword !== false) {
                validators.push(
                    passwordValidatorFactory(this.passwordPolicyService, (result) => {
                        this.passwordValidationResult = result;
                    })
                );
            }

            if (field === 'birthdate') {
                validators.push(
                    birthdateValidatorFactory({
                        minDate: this.minDate,
                        maxDate: this.maxDate,
                    })
                );
            }

            controls[field].setValidators(validators);
            controls[field].updateValueAndValidity({emitEvent: false});
        }
    }

    private patchForm(user: Partial<User> | null) {
        this.userForm.reset({
            username: user?.username ?? '',
            displayName: user?.displayName ?? '',
            password: '',
            birthdate: this.formatBirthdateForInput(user?.birthdate),
            gender: (user?.gender as string) ?? '',
            isAdmin: user?.isAdmin ?? false,
        });

        this.initialFormValue = this.userForm.getRawValue();
        this.userForm.markAsPristine();
        this.passwordValidationResult = undefined as never;
        this.isEditing = !!this.config.startInEditMode || !this.config.canToggleEdit;
    }

    private formatBirthdateForInput(birthdate?: string | Date | null): string | null {
        if (!birthdate) return null;
        const date = this.toDate(birthdate);
        if (!date) return null;
        return date.toISOString().substring(0, 10);
    }

    private toDate(value?: string | Date | null): Date | null {
        if (!value) return null;
        const date = typeof value === 'string' ? new Date(value) : value;
        return Number.isNaN(date.getTime()) ? null : date;
    }
}