import { PasswordPolicyService } from '../services/password-policy.service';
import { PasswordValidation } from '../interfaces';

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

