import {
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { rxResource, toSignal } from "@angular/core/rxjs-interop";

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
import { Textarea } from "primeng/textarea";
import { ConfigurationFilesPickerComponent } from "@mxflow/features/environment";
import { DevelopmentService } from "@mxevolve/domains/scm/data-access";
import { FactoryProductInputComponent } from "@mxevolve/domains/test/widget";
import { ToggleSwitchModule } from "primeng/toggleswitch";

export interface FactoryProductSubmissionValue {
  factoryProductId: string | undefined;
  commitMessage: string;
  selectedConfigurationFilePaths: string[];
  skipSubmission: boolean;
}

export type FactoryProductSubmissionMode = "edit" | "readonly";

@Component({
  selector: "mxevolve-factory-product-submission-form",
  templateUrl: "./factory-product-submission-form.component.html",
  imports: [
    ReactiveFormsModule,
    Textarea,
    FactoryProductInputComponent,
    ConfigurationFilesPickerComponent,
    ToggleSwitchModule,
  ],
  providers: [
    DevelopmentService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FactoryProductSubmissionFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => FactoryProductSubmissionFormComponent),
      multi: true,
    },
  ],
  host: {
    style: "display: contents;",
  },
})
export class FactoryProductSubmissionFormComponent
  implements ControlValueAccessor, Validator
{
  readonly projectId = input.required<string>();
  readonly developmentId = input.required<string>();
  readonly initialFactoryProductId = input<string | undefined>(undefined);
  readonly mode = input<FactoryProductSubmissionMode>("edit");

  readonly isReadonly = computed(() => this.mode() === "readonly");

  private readonly developmentService = inject(DevelopmentService);

  readonly repositoryId = computed(() =>
    this.development.hasValue() ? this.development.value().repository.id : ""
  );
  readonly factoryProductId = linkedSignal<string | undefined>(() =>
    this.initialFactoryProductId()
  );

  readonly form = new FormGroup({
    skipSubmission: new FormControl(false, {
      nonNullable: true,
    }),
    commitMessage: new FormControl<string>("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    selectedConfigurationFilePaths: new FormControl<string[]>([], {
      nonNullable: true,

      validators: [
        (control) => (control.value.length > 0 ? null : { required: true }),
      ],
    }),
  });

  private onChange: (value: FactoryProductSubmissionValue | null) => void =
    () => {};

  private onValidatorChange: () => void = () => {};

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  private readonly development = rxResource({
    params: () => ({
      projectId: this.projectId(),
      developmentId: this.developmentId(),
    }),
    stream: ({ params }) =>
      this.developmentService.getDevelopment(
        params.projectId,
        params.developmentId
      ),
  });

  readonly branchName = computed(() =>
    this.development.hasValue() ? this.development.value().name : ""
  );

  readonly value = computed<FactoryProductSubmissionValue>(() => {
    const fv = this.formValue();

    return {
      factoryProductId: this.factoryProductId(),
      commitMessage: fv.commitMessage ?? "",
      selectedConfigurationFilePaths: fv.selectedConfigurationFilePaths ?? [],
      skipSubmission: fv.skipSubmission ?? false,
    };
  });

  private readonly skipSubmission = computed(
    () => this.formValue().skipSubmission ?? false
  );

  readonly isValid = computed(
    () =>
      this.skipSubmission() ||
      this.isReadonly() ||
      (this.formStatus() === "VALID" && !!this.factoryProductId())
  );

  constructor() {
    this.form.valueChanges.subscribe(() => {
      this.onChange(this.value());
    });

    this.form.statusChanges.subscribe(() => {
      this.onValidatorChange();
    });

    effect(() => {
      const readonly = this.isReadonly();
      const skip = this.skipSubmission();

      if (!readonly) {
        this.enableControl(this.form.controls.skipSubmission);
      } else {
        this.disableControl(this.form.controls.skipSubmission);
      }

      const fieldsEnabled = !readonly && !skip;

      if (fieldsEnabled) {
        this.enableControl(this.form.controls.commitMessage);
        this.enableControl(this.form.controls.selectedConfigurationFilePaths);
      } else {
        this.disableControl(this.form.controls.commitMessage);
        this.disableControl(this.form.controls.selectedConfigurationFilePaths);
      }
      this.form.updateValueAndValidity();
    });
  }

  private enableControl(control: FormControl): void {
    if (control.disabled) {
      control.enable({ emitEvent: false });
    }
  }

  private disableControl(control: FormControl): void {
    if (control.enabled) {
      control.disable({ emitEvent: false });
    }
  }

  onFactoryProductIdChange(factoryProductId: string | undefined): void {
    if (this.isReadonly()) {
      return;
    }
    this.factoryProductId.set(factoryProductId);
    this.onChange(this.value());
    this.onValidatorChange();
  }

  writeValue(value: FactoryProductSubmissionValue | null): void {
    if (value) {
      this.factoryProductId.set(value.factoryProductId);
      this.form.setValue({
        skipSubmission: value.skipSubmission ?? false,
        commitMessage: value.commitMessage,
        selectedConfigurationFilePaths:
          value.selectedConfigurationFilePaths ?? [],
      });
    } else {
      this.factoryProductId.set(this.initialFactoryProductId());
      this.form.reset({
        skipSubmission: false,
        commitMessage: "",
        selectedConfigurationFilePaths: [],
      });
    }
  }

  registerOnChange(
    fn: (value: FactoryProductSubmissionValue | null) => void
  ): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {
    // No implementation needed for this method as we don't track touched state
  }

  validate(): ValidationErrors | null {
    return this.isValid() ? null : { invalid: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }
}
