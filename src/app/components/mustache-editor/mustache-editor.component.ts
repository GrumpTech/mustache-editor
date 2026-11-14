import {
  Component,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  input,
  AfterViewInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Completion } from '@codemirror/autocomplete';
import { Tab } from '@grumptech/ngx-matx/editor-app';
import { IFileService } from '@grumptech/ngx-matx/explorer';
import { MustacheCodemirror } from '../mustache-code-mirror/mustache-code-mirror.component';

@Component({
  selector: 'app-mustache-editor',
  templateUrl: './mustache-editor.component.html',
  styleUrls: ['./mustache-editor.component.scss'],
  imports: [MustacheCodemirror],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MustacheEditor implements AfterViewInit {
  readonly tab = input.required<Tab<string>>();

  protected partialCompletions: Completion[] = [];

  private fileService = inject(IFileService);
  private destroyRef = inject(DestroyRef);
  private editor = viewChild.required(MustacheCodemirror);

  ngAfterViewInit(): void {
    this.editor().setValue(this.tab().data);
    this.fileService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((names) => {
        this.partialCompletions = names.map((i) => ({
          label: i.endsWith('.mustache') ? i.substring(0, i.length - 9) : i,
        }));
      });
  }

  public validate(): boolean {
    return this.editor().validate();
  }

  protected updateData(value: string): void {
    this.tab().data = value;
  }
}
