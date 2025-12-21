import { Injectable } from '@angular/core';
import zxcvbn from 'zxcvbn';
import { PasswordValidation } from '../interfaces';

@Injectable({
    providedIn: 'root',
})
export class PasswordPolicyService {
    validatePassword(password: string): PasswordValidation {
        const strength = zxcvbn(password);
        const {score, feedback} = strength;
        const {warning, suggestions} = feedback;

        const isValid = !warning.length && !suggestions.length;

        return {isValid, score, suggestions, warning};
    }
}
