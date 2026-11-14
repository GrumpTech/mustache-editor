import { Observable, map, of, delay } from 'rxjs';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { Component, OnInit, ChangeDetectionStrategy, output, input } from '@angular/core';
import { MatError } from '@angular/material/form-field';
import JSON5 from 'json5';

@Component({
  selector: 'app-json-editor',
  templateUrl: 'json-editor.component.html',
  styleUrls: ['json-editor.component.scss'],
  imports: [MatError, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonEditor implements OnInit {
  control = input.required<FormControl>();
  validChange = output<string>();

  protected errorMessage = '';

  ngOnInit(): void {
    this.control().setAsyncValidators(this.getJson5Validator());
    this.control().markAsTouched();
  }

  private getJson5Validator(): AsyncValidatorFn {
    return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
      return of(control.value).pipe(
        delay(500),
        map((value) => {
          let parsedJson: any;
          try {
            parsedJson = JSON5.parse(value ?? '');
          } catch (error) {
            this.errorMessage = `Invalid json - ${(error as any).message}`;
            return { invalidJson: true };
          }
          this.errorMessage = '';
          this.validChange.emit(parsedJson);
          return null;
        }),
      );
    };
  }
}
