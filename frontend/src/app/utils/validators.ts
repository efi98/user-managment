import {PasswordPolicyService} from '@services/password-policy.service';
import {PasswordValidation} from '@interfaces';

export function passwordValidatorFactory(passwordPolicyService: PasswordPolicyService, setValidationResult?: (result: PasswordValidation) => void) {
    return function passwordValidator(control: any) {
        const isChanged = control.value?.length;
        if (!isChanged) return null;
        const validationResult = passwordPolicyService.validatePassword(control.value);
        if (setValidationResult) {
            setValidationResult(validationResult);
        }
        return validationResult.isValid ? null : validationResult;
    };
}

export function birthdateValidatorFactory(options: { minDate: string; maxDate: string }) {
    return function birthdateValidator(control: any) {
        const value = control.value;
        if (!value) return null;

        const birthdate = new Date(value);
        if (Number.isNaN(birthdate.getTime())) {
            return {birthdate: {message: 'Invalid birthdate.'}};
        }

        const minDate = new Date(options.minDate);
        const maxDate = new Date(options.maxDate);

        if (birthdate < minDate) {
            return {
                birthdate: `Birthdate must be on or after ${options.minDate}.`
            };
        }

        if (birthdate > maxDate) {
            return {
                birthdate: `Birthdate must be on or before ${options.maxDate}.`
            };
        }

        return null;
    };
}