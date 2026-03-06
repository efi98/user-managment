import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';
import {Severity} from "@interfaces";
import {MESSAGES} from "@consts";

@Component({
    selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class LoginComponent {
    loginForm;
    authService = inject(AuthService);
    toastService = inject(ToastService);
    fb = inject(FormBuilder);
    router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    constructor() {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required]],
        });
    }

    submit() {
        if (this.loginForm.invalid) {
            return;
        }

        const {username, password} = this.loginForm.value;

        this.authService.login({username: username!, password: password!}).subscribe({
            next: (user) => {
                if (user) {
                    this.toastService.show(MESSAGES.LOGIN_SUCCESS, Severity.Success);
                    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
                    this.router.navigateByUrl(returnUrl);
                }
            },
            error: (err) => {
                this.toastService.show(err, Severity.Error);
            },
        });
    }
}
