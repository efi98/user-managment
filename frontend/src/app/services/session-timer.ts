import { Injectable } from '@angular/core';
import { environment } from "@environments";
import { Subscription, timer } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class SessionTimer {
    private sessionTimerSub: Subscription | null = null;
    private readonly SESSION_TIMEOUT_MS = environment.SessionTimeoutMs;

    resetSessionTimer(onTimeout: () => void): void {
        if (this.sessionTimerSub) {
            this.sessionTimerSub.unsubscribe();
        }
        this.sessionTimerSub = timer(this.SESSION_TIMEOUT_MS).subscribe(() => {
            onTimeout();
        });
    }
}
