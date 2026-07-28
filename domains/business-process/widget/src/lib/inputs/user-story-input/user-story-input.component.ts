import {
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  input,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
} from "@angular/forms";
import { Button } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { debounceTime, map, Observable, of, switchMap, tap } from "rxjs";
import { catchError } from "rxjs/operators";
import { ValidateUserStoryService } from "@mxevolve/domains/business-process/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

type FieldStatus = "empty" | "pending" | "filled" | "valid" | "invalid";

/**
 * A single inline user-story field: its own text `FormControl`, plus reactive
 * `status`/`error` signals driving the inline validity icon and message.
 */
interface StoryField {
  readonly control: FormControl<string>;
  readonly status: WritableSignal<FieldStatus>;
  readonly error: WritableSignal<string | undefined>;
}

/**
 * New-architecture user-story input rendered as inline, growable fields: each
 * entered id is its own text field with an inline validity check (spinner while
 * validating, a green check when valid, an error message otherwise) and a
 * remove control; a trailing blue "+" adds another empty field once the
 * previous one is filled and valid. Feature-flagged validation
 * (`user-story-validation-and-transition`) is preserved via the migrated
 * {@link ValidateUserStoryService} and runs live (debounced) like the SCM
 * branch-existence input. Implemented as a `ControlValueAccessor` writing a
 * `string[]` (or `null` when empty, matching legacy behaviour).
 */
@Component({
  selector: "mxevolve-user-story-input",
  templateUrl: "./user-story-input.component.html",
  imports: [
    ReactiveFormsModule,
    IconField,
    InputIcon,
    InputText,
    Button,
    MxevolveIconComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UserStoryInputComponent),
      multi: true,
    },
  ],
})
export class UserStoryInputComponent implements ControlValueAccessor, OnInit {
  private static readonly USER_STORY_VALIDATION_AND_TRANSITION_FEATURE_FLAG =
    "user-story-validation-and-transition";

  /** Debounce before the live existence check runs, mirroring the branch input. */
  readonly validationDebounceMs = 400;

  readonly projectId = input.required<string>();
  readonly shouldValidate = input(false);

  private readonly isValidationEnabled = signal(false);

  /**
   * Whether an id is actually verified against the backend. Only then is a
   * green "valid" check shown — with the flag off we never fake a verification.
   */
  readonly validationActive = computed(
    () => this.isValidationEnabled() && this.shouldValidate()
  );

  private readonly userStoryValidator = inject(ValidateUserStoryService);
  private readonly messageService = inject(ToastMessageService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);
  private readonly destroyRef = inject(DestroyRef);

  readonly disabled = signal(false);
  readonly fields = signal<StoryField[]>([this.createField()]);

  /** The trailing "+" is enabled only when the last field holds an accepted id. */
  readonly canAdd = computed(() => {
    if (this.disabled()) {
      return false;
    }
    const last = this.fields().at(-1);
    if (!last) {
      return false;
    }
    const status = last.status();
    return status === "valid" || status === "filled";
  });

  private onChange: (value: string[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.featureFlagResolver
      .isFeatureEnabled(
        this.projectId(),
        UserStoryInputComponent.USER_STORY_VALIDATION_AND_TRANSITION_FEATURE_FLAG
      )
      .then((enabled: boolean) => {
        this.isValidationEnabled.set(enabled);
      })
      .catch(() => {
        this.isValidationEnabled.set(false);
      });
  }

  writeValue(value: string[] | null): void {
    const seeded = (value ?? []).filter(
      (id): id is string => id != null && id.trim().length > 0
    );
    this.fields.set(
      seeded.length > 0
        ? seeded.map((id) => this.createField(id))
        : [this.createField()]
    );
  }

  registerOnChange(fn: (value: string[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    for (const field of this.fields()) {
      if (isDisabled) {
        field.control.disable({ emitEvent: false });
      } else {
        field.control.enable({ emitEvent: false });
      }
    }
  }

  label(index: number): string {
    return index === 0 ? "User Story ID" : `User Story ID ${index + 1}`;
  }

  addField(): void {
    if (!this.canAdd()) {
      return;
    }
    this.fields.update((fields) => [...fields, this.createField()]);
  }

  removeField(field: StoryField): void {
    const fields = this.fields();
    if (fields.length > 1) {
      this.fields.set(fields.filter((current) => current !== field));
      this.emitChange();
    } else {
      field.control.setValue("");
    }
  }

  private createField(initial = ""): StoryField {
    const control = new FormControl<string>(initial, { nonNullable: true });
    if (this.disabled()) {
      control.disable({ emitEvent: false });
    }
    const field: StoryField = {
      control,
      status: signal<FieldStatus>(this.initialStatus(initial)),
      error: signal<string | undefined>(undefined),
    };

    control.valueChanges
      .pipe(
        tap((value) => {
          if (value?.trim()) {
            field.status.set(this.validationActive() ? "pending" : "filled");
            field.error.set(undefined);
          } else {
            field.status.set("empty");
            field.error.set(undefined);
            control.setErrors(null, { emitEvent: false });
          }
        }),
        debounceTime(this.validationDebounceMs),
        switchMap((value) => this.validate(field, value)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((errors) => {
        this.applyValidationResult(field, errors);
        this.emitChange();
      });

    return field;
  }

  private initialStatus(initial: string): FieldStatus {
    if (!initial.trim()) {
      return "empty";
    }
    return this.validationActive() ? "valid" : "filled";
  }

  private applyValidationResult(
    field: StoryField,
    errors: ValidationErrors | null
  ): void {
    const trimmed = field.control.value?.trim() ?? "";
    field.control.setErrors(errors, { emitEvent: false });
    if (errors) {
      field.status.set("invalid");
      field.error.set(this.firstError(errors));
    } else if (trimmed) {
      field.status.set(this.validationActive() ? "valid" : "filled");
      field.error.set(undefined);
    } else {
      field.status.set("empty");
      field.error.set(undefined);
    }
  }

  private validate(
    field: StoryField,
    value: string
  ): Observable<ValidationErrors | null> {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
      return of(null);
    }
    if (this.isDuplicate(field, trimmed)) {
      return of({ duplicate: "ID already exists" });
    }
    if (this.validationActive()) {
      return this.userStoryValidator
        .validateUserStory(this.projectId(), { userStoryId: trimmed })
        .pipe(
          map((result) =>
            result.valid
              ? null
              : { invalidStory: result.errorMessage ?? "Invalid user story" }
          ),
          catchError(() => {
            this.messageService.showError(
              "Something went wrong. Please try again later."
            );
            return of(null);
          })
        );
    }
    return of(null);
  }

  private isDuplicate(field: StoryField, trimmed: string): boolean {
    return this.fields().some(
      (current) =>
        current !== field && current.control.value?.trim() === trimmed
    );
  }

  private firstError(errors: ValidationErrors): string {
    return (
      errors["duplicate"] ?? errors["invalidStory"] ?? "Invalid user story"
    );
  }

  private emitChange(): void {
    const values = this.fields()
      .filter((field) => {
        const status = field.status();
        return status === "valid" || status === "filled";
      })
      .map((field) => field.control.value.trim())
      .filter((value) => value.length > 0);
    const unique = Array.from(new Set(values));
    this.onChange(unique.length === 0 ? null : unique);
    this.onTouched();
  }
}
