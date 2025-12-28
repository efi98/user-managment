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

    genderKeys(obj: any): string[] {
        return obj ? Object.keys(obj) : [];
    }
}
