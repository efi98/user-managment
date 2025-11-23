import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordValidation } from '../../interfaces';

@Component({
  selector: 'app-password-strength',
  imports: [CommonModule],
  templateUrl: './password-strength.html',
  styleUrls: ['./password-strength.scss']
})
export class PasswordStrengthComponent {
  @Input() passwordValidationResult!: PasswordValidation;
}
