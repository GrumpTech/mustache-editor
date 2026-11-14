import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private snackBar = inject(MatSnackBar);

  showMessage(message: string): void {
    this.snackBar.open(message, 'X');
  }

  clear(): void {
    this.snackBar.dismiss();
  }
}
