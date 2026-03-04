import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DialogService {
    private readonly isVisible = signal(false);
    isVisible$ = this.isVisible.asReadonly();
    private readonly message = signal('');
    message$ = this.message.asReadonly();
    private readonly action = new Subject<boolean>();
    action$ = this.action.asObservable();

    show(message: string) {
        this.message.set(message);
        this.isVisible.set(true);
    }

    hide() {
        this.isVisible.set(false);
    }

    confirm() {
        this.action.next(true);
        this.hide();
    }

    cancel() {
        this.action.next(false);
        this.hide();
    }
}
