import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserCardComponent } from '../user-card/user-card.component';

@Component({
    selector: 'app-home',
    imports: [CommonModule, UserCardComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomeComponent {
}
