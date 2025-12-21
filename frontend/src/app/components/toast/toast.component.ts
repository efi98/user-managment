import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { NgClass  } from '@angular/common';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  standalone: true,
  imports: [NgClass],
})
export class ToastComponent {
  toastService = inject(ToastService);
}

