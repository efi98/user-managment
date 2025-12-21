import { Injectable, signal } from '@angular/core';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { Toast, ToastSeverity } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSignal = signal<Toast | null>(null);
  toast = this.toastSignal.asReadonly();

  show(message: string, severity: ToastSeverity) {
    this.toastSignal.set({ message, severity });
    timer(5000)
      .pipe(take(1))
      .subscribe(() => {
        this.hide();
      });
  }

  hide() {
    this.toastSignal.set(null);
  }
}


