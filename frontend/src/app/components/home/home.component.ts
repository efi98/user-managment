import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-home',
    imports: [CommonModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomeComponent {
    stats: any = null;
    route = inject(ActivatedRoute);

    constructor() {
        this.stats = this.route.snapshot.data['stats'];
    }

    statKeys(obj: any, orderBy = 0): string[] {
        if (!obj) return [];
        const keys = Object.keys(obj);
        if (orderBy === 1) {
            return keys.sort((a, b) => obj[b] - obj[a]);
        }
        return keys;
    }
}
