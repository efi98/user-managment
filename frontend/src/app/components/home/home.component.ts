import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from "../dashboard/dashboard.component";
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-home',
    imports: [CommonModule, DashboardComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomeComponent {
    stats: any = null;
    private readonly route = inject(ActivatedRoute);

    constructor() {
        this.stats = this.route.snapshot.data['stats'];
    }
}
