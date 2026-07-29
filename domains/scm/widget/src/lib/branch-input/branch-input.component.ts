import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from "@angular/core";
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { catchError, debounceTime, map, of, switchMap, tap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  BRANCH_CHECK_FAILED_MESSAGE,
  BranchService,
  BranchDetailsError,
  GetBranchDetailsRequest,
} from "@mxevolve/domains/scm/data-access";

/**
 * New-architecture rebuild of the legacy
 * `web/libs/features/scm/src/lib/branch-input-component/branch-input.component.ts`.
 *
 * A branch-name text input that runs a debounced async existence check against
 * the SCM branch-details endpoint (via {@link BranchService}). When
 * `branchShouldExist` is true the branch must already exist (404 -> error);
 * when false the branch must NOT exist (200 -> error). Format rules are applied
 * only for the "create new branch" case. On initial load, if a prefilled value
 * is invalid, `initialInvalid` is emitted once so the consumer can surface a
 * contextual toast - exactly like the legacy component.
 */
@Component({
  selector: "mxevolve-branch-input",
  standalone: true,
  templateUrl: "./branch-input.component.html",
  imports: [ReactiveFormsModule, InputTextModule, IconField, InputIcon],
})
export class BranchInputComponent implements OnInit {
  readonly branchShouldExist = input(true);
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly branchNameFormControl = input.required<FormControl>();
  readonly inputId = input("branchName");
  readonly initialValue = input("");
  readonly initialInvalid = output<void>();

  private initialValidationDone = false;

  readonly debounceTime = 500;

  private readonly branchService = inject(BranchService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const control = this.branchNameFormControl();

    control.addValidators([
      this.branchNameFormatValidator(this.branchShouldExist()),
    ]);

    this.setupDebouncedAsyncValidation();

    const initialValue = this.initialValue();
    if (initialValue) {
      control.setValue(initialValue);
      control.markAsTouched();
    }

    control.updateValueAndValidity();
    if (initialValue && control.invalid) {
      this.notifyInitialValidationError();
    }
  }

  private setupDebouncedAsyncValidation(): void {
    this.branchNameFormControl()
      .valueChanges.pipe(
        tap((value) => {
          if (value !== null) {
            this.branchNameFormControl().markAsPending({ emitEvent: false });
          }
        }),
        debounceTime(this.debounceTime),
        switchMap((value) => this.validateBranchExists(value)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((asyncErrors) => {
        const control = this.branchNameFormControl();
        const currentErrors = control.errors || {};

        delete currentErrors["branchInvalid"];
        delete currentErrors["branchApiError"];

        if (asyncErrors) {
          Object.assign(currentErrors, asyncErrors);
        }

        const hasErrors = Object.keys(currentErrors).length > 0;
        control.setErrors(hasErrors ? currentErrors : null, {
          emitEvent: false,
        });
        if (this.isInitialValueInvalidAndNotReportedYet(hasErrors)) {
          control.markAsDirty();
          this.notifyInitialValidationError();
        }
        this.initialValidationDone = true;
      });
  }

  private isInitialValueInvalidAndNotReportedYet(hasErrors: boolean): boolean {
    return (
      !!this.initialValue() &&
      !this.initialValidationDone &&
      hasErrors &&
      this.branchNameFormControl().value === this.initialValue()
    );
  }

  private notifyInitialValidationError(): void {
    if (this.initialValidationDone) return;
    this.initialInvalid.emit();
  }

  private validateBranchExists(branchName: string) {
    if (!branchName?.trim()) {
      return of(null);
    }

    const syncErrors = this.branchNameFormatValidator(this.branchShouldExist())(
      {
        value: branchName,
      } as AbstractControl
    );

    if (syncErrors) {
      return of(null);
    }

    const request: GetBranchDetailsRequest = {
      projectId: this.projectId(),
      repositoryId: this.repositoryId(),
      branchName: branchName.trim(),
    };

    return this.branchService.getBranchDetails(request).pipe(
      map(() =>
        this.branchShouldExist()
          ? null
          : { branchInvalid: "Branch already exists." }
      ),
      catchError((err: BranchDetailsError) => {
        if (err?.status === 404) {
          return of(
            this.branchShouldExist()
              ? { branchInvalid: "Branch does not exist." }
              : null
          );
        }
        // Legacy relayed the raw backend text here, which surfaced stack traces
        // and 500 bodies to the user. Deliberately replaced with a generic
        // message (VAL-27132 divergence register KEEP-2).
        return of({ branchApiError: BRANCH_CHECK_FAILED_MESSAGE });
      })
    );
  }

  private branchNameFormatValidator(branchShouldExist: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const name = control.value;
      if (branchShouldExist || name === "" || name == null) return null;

      const rules: Array<[boolean, string]> = [
        [
          typeof name === "string" && !name.trim(),
          "Branch name cannot be blank or whitespace.",
        ],
        [/\s/.test(name), "Spaces are not allowed."],
        [
          /([~^:?*[\\@{]|\.{2}|\/\/)/.test(name),
          "Special characters are not allowed.",
        ],
        [
          name.startsWith("/") || name.endsWith("/"),
          "Cannot start or end with a slash.",
        ],
        [
          name.startsWith(".") || name.endsWith("."),
          "Cannot start or end with a dot.",
        ],
        [name.endsWith(".lock"), "Cannot end with '.lock'."],
        [
          name
            .split("/")
            .some((seg: string) => seg.startsWith(".") && seg.length > 1),
          "Cannot contain a segment starting with a dot.",
        ],
      ];

      for (const [condition, message] of rules) {
        if (condition) return { branchNameFormat: message };
      }

      return null;
    };
  }
}
