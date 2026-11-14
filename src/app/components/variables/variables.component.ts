import {
  Component,
  OnInit,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { lastValueFrom, Observable, map, firstValueFrom, startWith, filter } from 'rxjs';
import JSON5 from 'json5';
import Mustache from 'mustache';
import { IFileService } from '@grumptech/ngx-matx/explorer';
import { Tab } from '@grumptech/ngx-matx/editor-app';
import { TypeSelect } from '../type-select/type-select.component';
import { TypeSelectItem } from '../type-select/type-select-item';
import { Layout } from '../../models/layout';
import { ILayoutService } from '../../interfaces/layout-service';
import { TemplateReader } from '../../services/template-reader';
import { MessageService } from '../../services/message-service';
import { LocalLayoutService } from '../../services/local-layout-service';
import { JsonEditor } from '../json-editor/json-editor.component';

@Component({
  selector: 'app-variables',
  templateUrl: 'variables.component.html',
  styleUrl: 'variables.component.scss',
  providers: [{ provide: ILayoutService, useClass: LocalLayoutService }],
  imports: [
    AsyncPipe,
    MatIcon,
    MatIconButton,
    MatCheckbox,
    ReactiveFormsModule,
    TypeSelect,
    JsonEditor,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Variables implements OnInit {
  readonly tab = input.required<Tab<string>>();
  readonly rendering = input(false);
  readonly renderContent = output<string>();

  protected form = new FormGroup({
    layout: new FormControl(''),
    includePartials: new FormControl(false),
    testData: new FormControl('{}', { nonNullable: true }),
  });
  protected layouts?: Observable<TypeSelectItem[]>;

  private fileService = inject(IFileService);
  private layoutService = inject(ILayoutService);
  private templateReader = inject(TemplateReader);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private layout: Layout | null = null;
  private partials: Record<string, string> = {};

  constructor() {
    toObservable(this.rendering).subscribe((value) => value && this.render());
  }

  ngOnInit(): void {
    this.resetPartials();
    this.form.controls.testData.setValue(this.getTestData());
    this.render();
    this.layouts = this.layoutService.getAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      map((items) => items.map((i) => ({ value: i.id, label: i.name }))),
    );
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.messageService.clear());
  }

  protected generateData(): void {
    if (!this.validateLayout()) {
      return;
    }
    this.form.controls.testData.setValue(this.getTestData());
  }

  protected clearData(): void {
    this.form.controls.testData.setValue('{}');
  }

  protected async handleValidLayoutChange(layoutId: number | null): Promise<void> {
    this.layout = layoutId
      ? await lastValueFrom(this.layoutService.get(layoutId), {
          defaultValue: null,
        })
      : null;
    await this.renderWhenValid();
  }

  protected async handleIncludePartialChange(value: boolean): Promise<void> {
    if (value) {
      const template = this.getTemplateWithLayout();
      const partialNames = [...this.templateReader.getPartialNames(template)];
      await this.loadPartials(partialNames);
    } else {
      this.resetPartials();
    }
    await this.renderWhenValid();
  }

  protected async handleValidJsonChange(): Promise<void> {
    await this.renderWhenValid();
  }

  private render(): void {
    if (!this.rendering()) {
      return;
    }
    const template = this.getTemplateWithLayout();
    const formData = this.form.getRawValue();
    const data = JSON5.parse(formData.testData);
    const partials = formData.includePartials ? this.partials : {};
    try {
      this.renderContent.emit(Mustache.render(template, data, partials));
    } catch (error) {
      this.messageService.showMessage(
        'Error ocurred rendering the template. This might be caused by recursion.',
      );
      this.renderContent.emit('');
      throw error;
    }
  }

  private resetPartials(): void {
    this.partials = {};
    this.partials[this.tab().filename] = this.tab().data;
  }

  private validateLayout(): boolean {
    this.messageService.clear();
    if (this.form.controls.layout.valid) {
      return true;
    }
    this.form.controls.layout.markAsTouched();
    this.messageService.showMessage('Select valid layout.');
    return false;
  }

  private async renderWhenValid(): Promise<void> {
    if (!(await this.validateForm())) {
      this.form.markAllAsTouched();
      return;
    }
    this.render();
  }

  private async loadPartials(ids: string[]): Promise<void> {
    const loadingFailures: string[] = [];
    await this.loadPartialsRecursive(ids, loadingFailures);
    if (loadingFailures.length > 0) {
      this.messageService.showMessage(
        `Could not load partial${loadingFailures.length > 1 ? 's' : ''}: ${loadingFailures.join(', ')}.`,
      );
    }
  }

  private async loadPartialsRecursive(
    filenames: string[],
    loadingFailures: string[],
  ): Promise<void> {
    const partialNames = new Set<string>();
    for (let i = 0, l = filenames.length; i < l; i++) {
      const filename = filenames[i];
      if (this.partials[filename] !== undefined) {
        continue;
      }
      let content;
      try {
        content = await lastValueFrom(this.fileService.load(`${filename}.mustache`), {
          defaultValue: null,
        });
      } catch {
        content = null;
      }
      if (content === null) {
        loadingFailures.push(`${filename}`);
      }
      this.partials[`${filename}`] = content ?? '';
      if (!content) {
        continue;
      }
      this.templateReader.getPartialNames(content).forEach((p) => partialNames.add(p));
    }
    if (partialNames.size) {
      await this.loadPartialsRecursive([...partialNames], loadingFailures);
    }
  }

  private async validateForm(): Promise<boolean> {
    return firstValueFrom<boolean>(
      this.form.statusChanges.pipe(
        startWith(this.form.status),
        filter((status) => status !== 'PENDING'),
        map(() => this.form.valid),
      ),
    );
  }

  private getTestData(): string {
    const template = this.getTemplateWithLayout();
    return JSON5.stringify(this.templateReader.getTestData(template, this.partials), null, 2);
  }

  private getTemplateWithLayout(): string {
    const template = this.tab().data;
    const layout = this.layout ? this.layout.content : null;
    return layout ? layout.replace(/{{>[ ]*template[ ]*}}/g, template) : template;
  }
}
