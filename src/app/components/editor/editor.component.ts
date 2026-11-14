import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Tab } from '@grumptech/ngx-matx/editor-app';
import { MatxPanel, MatxPanelHeaderButton } from '@grumptech/ngx-matx/panel';
import { MustacheEditor } from '../mustache-editor/mustache-editor.component';
import { Variables } from '../variables/variables.component';
import { Preview } from '../preview/preview.component';
import { HelpDialog } from '../../dialogs/help/help.dialog';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  imports: [MustacheEditor, MatxPanel, MatxPanelHeaderButton, Variables, Preview],
  host: {
    '[class.hidden]': 'hidden()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor {
  readonly hidden = input(false);
  readonly tab = input.required<Tab<string>>();

  protected readonly editable = signal(true);
  protected readonly renderedContent = signal('');

  private editor = viewChild.required(MustacheEditor);

  private dialog = inject(MatDialog);

  protected setEditable(newValue: boolean): void {
    if (!newValue && !this.editor().validate()) {
      return;
    }
    this.editable.set(newValue);
  }

  protected showHelp(): void {
    this.dialog.open(HelpDialog, {
      height: '98%',
      width: '98%',
      maxWidth: '1200px',
    });
  }

  protected renderContent(content: string) {
    this.renderedContent.set(content);
  }
}
