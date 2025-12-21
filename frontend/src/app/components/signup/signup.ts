import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Gender, NewUser, PasswordValidation } from '../../interfaces';
import { AuthService } from '../../services/auth.service';
import { PasswordPolicyService } from '../../services/password-policy.service';
import { PasswordStrengthComponent } from '../password-strength/password-strength';
import { GENDERS_LIST } from "../../consts";
import { passwordValidatorFactory } from '../../utils/validators';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-signup',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordStrengthComponent],
    templateUrl: './signup.html',
    styleUrl: './signup.scss'
})
export class SignupComponent {
    signupForm;
    loading = false;
    fb = inject(FormBuilder);
    router = inject(Router);
    authService = inject(AuthService);
    toastService = inject(ToastService);
    passwordPolicyService = inject(PasswordPolicyService);
    passwordValidationResult!: PasswordValidation;
    protected readonly GENDERS_LIST = GENDERS_LIST;

    constructor() {
        this.signupForm = this.fb.group({
            username: ['', [Validators.required]],
            displayName: [''],
            password: ['', [
                Validators.required,
                passwordValidatorFactory(
                    this.passwordPolicyService,
                    (result) => {
                        this.passwordValidationResult = result;
                    }
                )
            ]],
            age: [null, [Validators.min(1), Validators.max(120), Validators.pattern(/^[0-9]+$/)]],
            gender: ['']
        });
    }

    submit() {
        if (this.signupForm.invalid) {
            return;
        }
        this.loading = true;

        const formValue = this.signupForm.value;
        const newUser: NewUser = {
            username: formValue.username!,
            password: formValue.password!,
            displayName: formValue.displayName!,
        };
        if (formValue.age) {
            newUser.age = parseInt(formValue.age);
        }
        if (formValue.gender) {
            newUser.gender = formValue.gender as Gender;
        }

        this.authService.signup(newUser).subscribe({
            next: (user) => {
                if (user) {
                    this.toastService.show('Signup successful!', 'success');
                    this.router.navigateByUrl('/');
                }
            },
            error: (err) => {
                this.toastService.show(`Signup failed: ${err.message}`, 'error');
            },
            complete: () => {
                this.loading = false;
            }
        });
    }
}
