import {Injectable, signal} from '@angular/core';
import {Subscription, timer} from 'rxjs';
import {take} from 'rxjs/operators';
import {Toast, ToastSeverity} from '@interfaces';
import {TOAST_TIMEOUT} from "@consts";

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    private readonly toastSignal = signal<Toast | null>(null);
    toast = this.toastSignal.asReadonly();
    private hideTimer?: Subscription;

    show(message: string | string[], severity: ToastSeverity) {
        message = Array.isArray(message) ? message.join('\n') : message;
        this.toastSignal.set({message, severity});


        if (this.hideTimer) {
            this.hideTimer.unsubscribe();
        }

        this.hideTimer = timer(TOAST_TIMEOUT)
            .pipe(take(1))
            .subscribe(() => {
                this.hide();
            });
    }

    hide() {
        this.toastSignal.set(null);
    }
}


