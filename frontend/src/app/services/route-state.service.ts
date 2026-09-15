import {Injectable, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router} from '@angular/router';
import {filter, map, startWith} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RouteStateService {
    private readonly router = inject(Router);

    readonly currentRouteUrl = toSignal(
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            map(event => event.urlAfterRedirects),
            startWith(this.router.url),
        ),
        {initialValue: this.router.url},
    );
}
