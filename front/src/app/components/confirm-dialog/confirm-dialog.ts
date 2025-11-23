import { Component, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.html',
    styleUrls: ['./confirm-dialog.scss'],
    imports: [CommonModule]
})
export class ConfirmDialogComponent {
    dialogService = inject(DialogService);

    onConfirm() {
        this.dialogService.confirm();
    }

    onCancel() {
        this.dialogService.cancel();
    }
}
