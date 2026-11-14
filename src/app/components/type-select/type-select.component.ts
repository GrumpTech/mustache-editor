import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  output,
  input,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatAutocompleteModule, MatOption } from '@angular/material/autocomplete';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { map, Observable } from 'rxjs';
import { TypeSelectItem } from './type-select-item';

@Component({
  selector: 'app-type-select',
  templateUrl: 'type-select.component.html',
  styleUrls: ['type-select.component.scss'],
  imports: [
    AsyncPipe,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatOption,
    MatInput,
    MatIcon,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeSelect implements OnInit {
  control = input.required<FormControl>();
  label = input('');
  options = input<TypeSelectItem[]>([]);
  showClearButton = input(true);
  allowEmpty = input(false);
  validChange = output<number | null>();

  private destroyRef = inject(DestroyRef);

  protected filteredOptions?: Observable<TypeSelectItem[]>;

  private firstClick = true;

  ngOnInit(): void {
    this.control().setValidators(this.getInListValidator());
    this.filteredOptions = this.control().valueChanges.pipe(
      map((value) => {
        value = value?.toLowerCase() ?? '';
        return this.options()
          .filter(
            (i) =>
              i.label.toLowerCase().includes(value ?? '') ||
              i.value.toString().includes(value ?? ''),
          )
          .sort((x, y) => x.label.localeCompare(y.label));
      }),
    );
    this.control()
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleChange());
  }

  protected getValue(): number | null {
    return this.options().find((i) => i.label === this.control().value)?.value ?? null;
  }

  protected handleClick(): void {
    // show autoselectoption on first click
    if (this.firstClick) {
      this.control().setValue(this.control().value);
      this.firstClick = false;
    }
  }

  protected handleChange(): void {
    if (this.control().valid) {
      this.validChange.emit(this.getValue());
    }
  }

  protected clear(event: MouseEvent): void {
    this.control().setValue(undefined);
    event.stopImmediatePropagation();
  }

  private getInListValidator(): ValidatorFn {
    return (control: AbstractControl<string>): ValidationErrors | null => {
      const value = control.value;
      const valid = (this.allowEmpty() && !value) || this.options().some((i) => i.label === value);
      return valid ? null : { notInList: true };
    };
  }
}
