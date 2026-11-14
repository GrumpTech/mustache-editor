import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-help-dialog',
  templateUrl: 'help.dialog.html',
  styleUrls: ['help.dialog.scss'],
  imports: [MatDialogModule, MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialog {}
