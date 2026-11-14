import { ChangeDetectionStrategy, Component, OnInit, input, output } from '@angular/core';
import { MenuBarItem, MenuItem } from '@grumptech/ngx-matx/menu-bar';
import { FileCommand, FileCommandType } from '@grumptech/ngx-matx/editor-app';
import { MatxMenuBar } from '@grumptech/ngx-matx/menu-bar';

@Component({
  selector: 'app-menu-bar',
  templateUrl: 'menu-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatxMenuBar],
})
export class MenuBar implements OnInit {
  readonly importers = input<string[]>([]);
  readonly exporters = input<string[]>([]);
  readonly commandReceived = output<FileCommand>();

  protected menuBar: MenuBarItem<FileCommand>[] = [
    {
      text: 'File',
      children: [
        {
          text: 'New',
          icon: 'note_add',
          shortcuts: [{ ctrl: true, alt: true, keyCode: 'KeyN' }],
          data: new FileCommand(FileCommandType.FileNew),
        },
        {
          text: 'Save',
          icon: 'save',
          shortcuts: [{ ctrl: true, keyCode: 'KeyS' }],
          data: new FileCommand(FileCommandType.FileSave),
        },
        {
          text: 'Save as...',
          icon: 'save_as',
          shortcuts: [{ ctrl: true, alt: true, keyCode: 'KeyS' }],
          data: new FileCommand(FileCommandType.FileSaveAs),
        },
        {
          text: 'Save all',
          icon: '',
          shortcuts: [{ ctrl: true, shift: true, keyCode: 'KeyS' }],
          data: new FileCommand(FileCommandType.FileSaveAll),
        },
        {
          text: 'Rename',
          icon: 'edit',
          shortcuts: [{ ctrl: true, keyCode: 'KeyR' }],
          data: new FileCommand(FileCommandType.FileRename),
        },
        {
          text: 'Delete',
          icon: 'delete',
          shortcuts: [{ ctrl: true, keyCode: 'Delete' }],
          data: new FileCommand(FileCommandType.FileDelete),
        },
        {
          text: 'Close',
          icon: 'close',
          shortcuts: [{ ctrl: true, keyCode: 'KeyQ' }],
          data: new FileCommand(FileCommandType.FileClose),
        },
        {
          text: 'Close all',
          icon: '',
          shortcuts: [{ ctrl: true, shift: true, keyCode: 'KeyQ' }],
          data: new FileCommand(FileCommandType.FileCloseAll),
        },
      ],
    },
  ];

  protected handleClick(item: MenuItem<FileCommand>) {
    this.commandReceived.emit(item.data);
  }

  ngOnInit() {
    const importers = this.importers();
    if (importers.length) {
      this.menuBar[0].children.push({
        text: 'Import',
        icon: 'file_upload',
        data: new FileCommand(FileCommandType.FileImport),
        children:
          importers.length > 1
            ? importers.map((i) => ({
                text: i,
                data: new FileCommand(FileCommandType.FileImport, i),
              }))
            : [],
      });
    }
    const exporters = this.exporters();
    if (exporters.length) {
      this.menuBar[0].children.push({
        text: 'Export',
        icon: 'file_download',
        data: new FileCommand(FileCommandType.FileExport),
        children:
          exporters.length > 1
            ? exporters.map((i) => ({
                text: i,
                data: new FileCommand(FileCommandType.FileExport, i),
              }))
            : [],
      });
    }
  }
}
