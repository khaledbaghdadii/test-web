import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { InputText } from "primeng/inputtext";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { ValidationScope } from "../model/validation-scope.model";
import { FloatLabel } from "primeng/floatlabel";
import { SplitButton } from "primeng/splitbutton";
import { MenuItem } from "primeng/api";

@Component({
  selector: "mxevolve-validation-scope-setter",
  imports: [
    CommonModule,
    InputText,
    ReactiveFormsModule,
    FloatLabel,
    SplitButton,
  ],
  templateUrl: "./validation-scope-setter.component.html",
})
export class ValidationScopeSetterComponent {
  private _validationScope?: ValidationScope;
  validationScopeMenuItems: MenuItem[] = [];

  bothOrNoneRequired: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const target = group.get("targetVersion")?.value?.trim();
    const source = group.get("sourceVersion")?.value?.trim();

    const oneFilled = !!target || !!source;
    const bothFilled = !!target && !!source;

    return oneFilled && !bothFilled ? { bothOrNoneRequired: true } : null;
  };

  @Input() get validationScope(): ValidationScope | undefined {
    return this._validationScope;
  }
  @Input() initialValidationScope?: ValidationScope;

  set validationScope(value: ValidationScope | undefined) {
    if (value && (!value.currentVersion || !value.referenceVersion)) {
      value = undefined;
    }
    this._validationScope = value;
    this.updateFormValues(value);
  }

  @Output() validationScopeChange = new EventEmitter<ValidationScope>();

  formBuilder = inject(FormBuilder);
  validationScopeSetterForm = this.formBuilder.group(
    {
      targetVersion: new FormControl<string | null>(null, [
        WhitespaceValidators.notBlank(),
      ]),
      sourceVersion: new FormControl<string | null>(null, [
        WhitespaceValidators.notBlank(),
      ]),
    },
    {
      validators: this.bothOrNoneRequired,
    }
  );

  private updateFormValues(value: ValidationScope | undefined) {
    this.validationScopeSetterForm.patchValue({
      targetVersion: value?.currentVersion ?? null,
      sourceVersion: value?.referenceVersion ?? null,
    });
  }

  onSubmit() {
    if (!this.validationScopeSetterForm.invalid) {
      this.validationScopeChange.emit(this.getValidationScopeFromForm());
    }
  }

  private getValidationScopeFromForm(): ValidationScope {
    const targetVersion = this.validationScopeSetterForm
      .get("targetVersion")
      ?.value?.trim();
    const sourceVersion = this.validationScopeSetterForm
      .get("sourceVersion")
      ?.value?.trim();

    return {
      currentVersion: targetVersion === "" ? undefined : targetVersion,
      referenceVersion: sourceVersion === "" ? undefined : sourceVersion,
    };
  }

  showValidationScopeMenuOptions() {
    this.validationScopeMenuItems = [
      {
        label: "Reset Validation Scope",
        command: () => this.reset(),
        disabled: this.validationScope === this.initialValidationScope,
      },
    ];
  }

  private reset() {
    this.validationScopeChange.emit(this.initialValidationScope);
  }
}
