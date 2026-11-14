import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, Observable, Subject } from 'rxjs';
import { MatxEditorApp, Tab, FileCommand, Result } from '@grumptech/ngx-matx/editor-app';
import { ModificationState, TabsManager } from '@grumptech/ngx-matx/file-tab-bar';
import { MenuBar } from '../menu-bar/menu-bar.component';
import { Editor } from '../editor/editor.component';

@Component({
  selector: 'app-designer',
  templateUrl: './designer.component.html',
  styleUrl: './designer.component.scss',
  imports: [MatxEditorApp, Editor, MenuBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Designer {
  protected convert: (content: string) => Result<string>;
  protected convertBack: (data: string) => string;

  protected tabs: Signal<Tab<string>[]>;
  protected selectedTab: Signal<Tab<string> | null>;
  protected readonly onFileCommand: Observable<FileCommand>;

  private tabsManager = inject(TabsManager<Tab<string>>);
  private readonly command = new Subject<FileCommand>();

  constructor() {
    this.onFileCommand = this.command.pipe(filter((i) => i instanceof FileCommand));
    this.tabs = toSignal(this.tabsManager.onChange, { initialValue: [] });
    this.selectedTab = toSignal(this.tabsManager.onSelectionChange, {
      initialValue: null,
    });
    this.convert = (content) => ({ result: content, success: true, message: '' });
    this.convertBack = (data) => data;
  }

  hasModifiedTabs(): boolean {
    return this.tabsManager.hasModifiedTab();
  }

  protected handleCommand(command: FileCommand): void {
    this.command.next(command);
  }

  protected handleDataChange(tab: Tab<string>): void {
    this.tabsManager.update(tab, {
      modificationState:
        tab.modificationState === ModificationState.New
          ? ModificationState.New
          : ModificationState.Unknown,
    });
  }
}
