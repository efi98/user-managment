import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog';
import { ToastComponent } from './components/toast/toast.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, Navbar, CommonModule, ConfirmDialogComponent, ToastComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
}
