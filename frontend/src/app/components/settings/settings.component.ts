import { Component } from '@angular/core';
import { UserCardComponent } from "../user-card/user-card.component";

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    imports: [
        UserCardComponent
    ],
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {

}
