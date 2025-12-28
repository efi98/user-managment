import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
    @Input() stats: any = null;

    statKeys(obj: any, orderBy = 0): string[] {
        if (!obj) return [];
        const keys = Object.keys(obj);
        if (orderBy === 1) {
            return keys.sort((a, b) => obj[b] - obj[a]);
        }
        return keys;
    }
}
