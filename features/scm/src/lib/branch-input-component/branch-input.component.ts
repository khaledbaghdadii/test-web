import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";

import { InputTextModule } from "primeng/inputtext";
import { ScmService } from "../scm.service";
import { GetBranchDetailsRequest } from "../branch-details/get-branch-details-request";
import { catchError, debounceTime, map, of, switchMap, tap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";

@Component({
  selector: "mxevolve-branch-input",
  templateUrl: "./branch-input.component.html",
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, IconField, InputIcon],
})
export class BranchInputComponent implements OnInit {
  @Input() branchShouldExist = true;
  @Input({ required: true }) projectId!: string;
  @Input({ required: true }) repoId!: string;
  @Input({ required: true }) branchNameFormControl!: FormControl;
  @Input() initialValue: string = "";
  @Output() initialInvalid = new EventEmitter<void>();

  private initialValidationDone = false;

  debounceTime: number = 500;

  private readonly scmService = inject(ScmService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.branchNameFormControl.addValidators([
      this.branchNameFormatValidator(this.branchShouldExist),
    ]);

    this.setupDebouncedAsyncValidation();

    if (this.initialValue) {
      this.branchNameFormControl.setValue(this.initialValue);
      this.branchNameFormControl.markAsTouched();
    }

    this.branchNameFormControl.updateValueAndValidity();
    if (this.initialValue && this.branchNameFormControl.invalid) {
      this.notifyInitialValidationError();
    }
  }

  private setupDebouncedAsyncValidation(): void {
    this.branchNameFormControl.valueChanges
      .pipe(
        tap((value) => {
          if (value !== null) {
            this.branchNameFormControl.markAsPending({ emitEvent: false });
          }
        }),
        debounceTime(this.debounceTime),
        switchMap((value) => this.validateBranchExists(value)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((asyncErrors) => {
        const currentErrors = this.branchNameFormControl.errors || {};

        delete currentErrors["branchInvalid"];
        delete currentErrors["branchApiError"];

        if (asyncErrors) {
          Object.assign(currentErrors, asyncErrors);
        }

        const hasErrors = Object.keys(currentErrors).length > 0;
        this.branchNameFormControl.setErrors(hasErrors ? currentErrors : null, {
          emitEvent: false,
        });
        if (this.isInitialValueInvalidAndNotReportedYet(hasErrors)) {
          this.branchNameFormControl.markAsDirty();
          this.notifyInitialValidationError();
        }
        this.initialValidationDone = true;
      });
  }

  private isInitialValueInvalidAndNotReportedYet(hasErrors: boolean) {
    return (
      this.initialValue &&
      !this.initialValidationDone &&
      hasErrors &&
      this.branchNameFormControl.value === this.initialValue
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

    const syncErrors = this.branchNameFormatValidator(this.branchShouldExist)({
      value: branchName,
    } as AbstractControl);

    if (syncErrors) {
      return of(null);
    }

    const request: GetBranchDetailsRequest = {
      projectId: this.projectId,
      repoId: this.repoId,
      branchName: branchName.trim(),
    };

    return this.scmService.getBranchDetails(request).pipe(
      map(() => {
        return this.branchShouldExist
          ? null
          : { branchInvalid: "Branch already exists." };
      }),
      catchError((err) => {
        if (err?.status === 404) {
          return of(
            this.branchShouldExist
              ? { branchInvalid: "Branch does not exist." }
              : null
          );
        }
        return of({
          branchApiError: `Unable to validate branch: ${
            err.message || "Unknown error"
          }`,
        });
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
