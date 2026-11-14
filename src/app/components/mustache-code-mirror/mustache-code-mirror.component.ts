import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  input,
  output,
  viewChild,
} from '@angular/core';
import { EditorView } from 'codemirror';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldKeymap,
} from '@codemirror/language';
import {
  Diagnostic,
  lintGutter,
  lintKeymap,
  nextDiagnostic,
  setDiagnostics,
  setDiagnosticsEffect,
} from '@codemirror/lint';
import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { EditorState, Extension, SelectionRange } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
  Completion,
} from '@codemirror/autocomplete';
import { mustacheLanguage } from '../../classes/lang-mustache';
import { MustacheLinterFactory } from '../../classes/mustache-linter';
import { ValidationStatus } from '../../enums/validation-status';

@Component({
  selector: 'app-mustache-code-mirror',
  templateUrl: 'mustache-code-mirror.component.html',
  styleUrls: ['mustache-code-mirror.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MustacheCodemirror implements OnInit {
  partialCompletions = input<Completion[]>([]);
  value = output<string>();

  protected editor?: EditorView;

  private codeMirror = viewChild.required<ElementRef>('codeMirror');
  private mustacheLinterFactory: MustacheLinterFactory;
  private extensions: Extension[] = [];
  private validationStatus = ValidationStatus.Pending;

  constructor() {
    this.mustacheLinterFactory = new MustacheLinterFactory();
    this.extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      EditorView.lineWrapping,
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          this.value.emit(this.getValue());
          this.validationStatus = ValidationStatus.Pending;
        }
        update.transactions.forEach((t) =>
          t.effects.forEach(
            (e) =>
              e.is(setDiagnosticsEffect) &&
              (this.validationStatus = this.isValid(e.value as Diagnostic[])
                ? ValidationStatus.Valid
                : ValidationStatus.Invalid),
          ),
        );
      }),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
      mustacheLanguage({
        getPartialCompletions: () => this.partialCompletions(),
      }),
      this.mustacheLinterFactory.create(),
      lintGutter(),
    ];
  }

  ngOnInit(): void {
    this.editor = new EditorView({
      doc: '',
      extensions: this.extensions,
      parent: this.codeMirror().nativeElement,
    });
  }

  setValue(newValue: string): void {
    this.editor?.dispatch({
      changes: {
        from: 0,
        to: this.editor?.state.doc.length,
        insert: newValue,
      },
    });
  }

  getSelection(): string {
    const range = this.getRange();
    return range ? (this.editor?.state.sliceDoc(range.from, range.to) ?? '') : '';
  }

  replaceSelection(newValue: string): void {
    const range = this.getRange();
    this.editor?.dispatch({
      changes: {
        from: range?.from ?? 0,
        to: range?.to ?? 0,
        insert: newValue,
      },
    });
  }

  validate(): boolean {
    if (!this.editor) {
      return false;
    }
    let valid = this.validationStatus === ValidationStatus.Valid;
    if (this.validationStatus === ValidationStatus.Pending) {
      const diagnostics = this.mustacheLinterFactory.lint(this.editor);
      this.editor?.dispatch(setDiagnostics(this.editor.state, diagnostics));
      valid = this.isValid(diagnostics);
    }
    if (!valid) {
      nextDiagnostic(this.editor);
    }
    return valid;
  }

  private getRange(): SelectionRange | null {
    return this.editor?.state.selection.ranges.length
      ? this.editor?.state.selection.ranges[0]
      : null;
  }

  private getValue(): string {
    return this.editor?.state.doc.toString() ?? '';
  }

  private isValid(diagnostics: Diagnostic[]): boolean {
    return !diagnostics.some((d) => d.severity === 'error');
  }
}
