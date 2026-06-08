import { Component, computed, effect, forwardRef, input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from "@angular/forms";
import {
  DeleteDevelopmentCheckboxComponent,
  DeleteDevelopmentValue,
} from "@mxevolve/domains/business-process/widget";
import { RadioButton } from "primeng/radiobutton";
import { Textarea } from "primeng/textarea";
import {
  QualityGateValidationDecision,
  ExecutionFamily,
} from "@mxevolve/domains/business-process/util";

export interface QualityGateValidationValue {
  validationDecision: QualityGateValidationDecision | null;
  comment: string;
  deleteBranch: DeleteDevelopmentValue | null;
}

@Component({
  selector: "mxevolve-quality-gate-validation-form",
  templateUrl: "./quality-gate-validation-form.component.html",
  imports: [
    RadioButton,
    Textarea,
    ReactiveFormsModule,
    DeleteDevelopmentCheckboxComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QualityGateValidationFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => QualityGateValidationFormComponent),
      multi: true,
    },
  ],
  host: {
    style: "display: contents;",
  },
})
export class QualityGateValidationFormComponent
  implements ControlValueAccessor, Validator
{
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly supportsResourceManagement = input.required<boolean>();

  readonly ExecutionFamily = ExecutionFamily;

  readonly QualityGateValidationDecision = QualityGateValidationDecision;

  readonly form = new FormGroup({
    validationDecision: new FormControl<QualityGateValidationDecision | null>(
      null,
      Validators.required
    ),
    comment: new FormControl<string>("", { nonNullable: true }),
    deleteBranch: new FormControl<DeleteDevelopmentValue | null>(null),
  });

  private onChange: (value: QualityGateValidationValue | null) => void =
    () => {};
  onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly value = computed<QualityGateValidationValue>(() => {
    const formValue = this.formValue();
    return {
      validationDecision: formValue.validationDecision ?? null,
      comment: formValue.comment ?? "",
      deleteBranch: formValue.deleteBranch ?? null,
    };
  });

  constructor() {
    effect(() => {
      this.onChange(this.value());
    });

    effect(() => {
      this.formStatus();
      this.onValidatorChange();
    });
  }

  writeValue(value: QualityGateValidationValue | null): void {
    if (value) {
      this.form.setValue(value);
    } else {
      this.form.reset();
    }
  }

  registerOnChange(
    fn: (value: QualityGateValidationValue | null) => void
  ): void {
    this.onChange = fn;
    fn(this.value());
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(): ValidationErrors | null {
    return this.form.valid ? null : { invalid: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }
}
