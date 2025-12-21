import { Component, inject, OnInit } from '@angular/core';
import type { CellClickedEvent, ColDef } from 'ag-grid-community';
import { AgGridAngular } from "ag-grid-angular";
import { UserService } from "../../services/user.service";
import { AuthStore } from "../../store/auth.store";
import { getRelativeTime } from "../../utils/utilities";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
    selector: 'app-admin-panel',
    imports: [
        AgGridAngular
    ],
    templateUrl: './admin-panel.component.html',
    styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
    colDefs: ColDef[] = [
        {
            field: "username",
            filter: true,
            colId: "username",
            cellClass: 'link-cell',
            suppressMovable: true,
            pinned: "left"
        },
        {field: "displayName", filter: true},
        {field: "age", filter: true, minWidth: 70, maxWidth: 100,},
        {
            field: "gender",
            filter: true,
            cellStyle: params => {
                switch ((params.value || '').toLowerCase()) {
                    case 'male':
                        return {backgroundColor: '#cce5ff'};
                    case 'female':
                        return {backgroundColor: '#f8d7da'};
                    case 'other':
                        return {backgroundColor: '#e2e3e5'};
                    default:
                        return {backgroundColor: 'transparent'};
                }
            }
        },
        {field: "isAdmin", filter: true},
        {field: "createdAt", filter: true, cellRenderer: (d: any) => getRelativeTime(d.value)},
        {field: "updatedAt", filter: true, cellRenderer: (d: any) => getRelativeTime(d.value)},
    ];
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authStore = inject(AuthStore);
    users = this.authStore.users;
    private userService = inject(UserService);

    ngOnInit(): void {
        this.userService.getUsers().subscribe();
    }

    onCellClicked(event: CellClickedEvent) {
        if (event.colDef.colId === 'username') {
            const username = event.data?.username;
            if (username) {
                this.authStore.setSelectedUser(event.data);
                this.router.navigate([username], {relativeTo: this.route});
            }
        }
    }
}
