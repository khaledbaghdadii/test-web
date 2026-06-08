import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { WhitespaceValidators } from "@mxflow/validator";
import { Store } from "@ngrx/store";
import { concatMap, Subject, takeUntil } from "rxjs";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { SelectModule } from "primeng/select";
import { CardContainerModule } from "@mxflow/ui/container";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";
import { ButtonModule } from "primeng/button";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { CommonModule } from "@angular/common";
import { InputTextModule } from "primeng/inputtext";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { CreateTestDefinitionRequest } from "@mxevolve/domains/test/model";
import { TestSequenceSingleSelectorComponent } from "@mxevolve/domains/test/widget";
import { TestPackageDirectoryPickerComponent } from "@mxevolve/domains/test/composite-widget";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

const DEFAULT_TIMEOUT_VALUE = 24;
const TEST_OBJECTS_FEATURE_FLAG = "test-objects";

@Component({
  selector: "mxevolve-test-definition-create",
  templateUrl: "./test-definition-create.component.html",
  imports: [
    SelectModule,
    CommonModule,
    CardContainerModule,
    MxflowSpinnerModule,
    ButtonModule,
    ReactiveFormsModule,
    MandatoryFieldModule,
    HeaderTitleModule,
    InputTextModule,
    TestSequenceSingleSelectorComponent,
    TestPackageDirectoryPickerComponent,
  ],
})
export class TestDefinitionCreateComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private testDefinitionService = inject(TestDefinitionService);
  private repositoryService = inject(RepositoryService);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastMessageService = inject(ToastMessageService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);

  private readonly destroy$ = new Subject();

  repositories: Repository[];
  testDefinitionCreationForm: FormGroup;
  projectId: string;
  isLoading = false;
  useTestSequenceSelector = false;

  ngOnInit() {
    this.isLoading = true;
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(
        takeUntil(this.destroy$),
        concatMap((projectId) => {
          this.projectId = projectId;
          this.featureFlagResolver
            .isFeatureEnabled(projectId, TEST_OBJECTS_FEATURE_FLAG)
            .then((enabled) => (this.useTestSequenceSelector = enabled))
            .catch(() => (this.useTestSequenceSelector = false));
          return this.repositoryService.getTestRepositories(this.projectId);
        })
      )
      .subscribe({
        next: (repositories) => {
          this.repositories = repositories;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.showErrorMessage(error);
        },
      });

    this.testDefinitionCreationForm = this.formBuilder.group({
      projectId: [this.projectId],
      repoId: [null, [Validators.required]],
      path: [
        null,
        [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ],
      ],
      description: [
        null,
        [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ],
      ],
      timeout: [
        null,
        [
          WhitespaceValidators.notBlank(),
          Validators.maxLength(255),
          this.isValidNumber(),
        ],
      ],
    });

    this.testDefinitionCreationForm
      .get("repoId")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.testDefinitionCreationForm.get("path")?.setValue(null);
      });
  }

  onSubmit() {
    if (this.testDefinitionCreationForm.valid) {
      this.isLoading = true;
      this.testDefinitionService
        .create(this.projectId, this.getCreateTestDefinitionRequest())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (testDefinitionId) => {
            this.isLoading = false;
            this.showSuccessMessage("Test Definition Successfully Created");
            this.testDefinitionCreationForm.reset();
            this.router
              .navigate(["../details", testDefinitionId], {
                relativeTo: this.route,
              })
              .then();
          },
          error: (error) => {
            this.isLoading = false;
            this.showErrorMessage(error);
          },
        });
    } else {
      this.displayInvalidInputs.call(this);
    }
  }

  private getCreateTestDefinitionRequest(): CreateTestDefinitionRequest {
    const name = this.resolveName();
    return {
      name,
      repoId: this.testDefinitionCreationForm.value["repoId"],
      description: this.testDefinitionCreationForm.value["description"],
      path: this.resolvePath(name),
      timeoutDuration: {
        days: 0,
        hours: this.resolveTimeoutDuration(),
        minutes: 0,
      },
    };
  }

  private resolveName(): string {
    const formPath = this.testDefinitionCreationForm.value["path"];
    return this.useTestSequenceSelector
      ? formPath
      : formPath.split("/").at(-1) ?? formPath;
  }

  private resolvePath(name: string): string {
    return this.useTestSequenceSelector
      ? `common/mxtest/test_packages/${name}`
      : this.testDefinitionCreationForm.value["path"];
  }

  private displayInvalidInputs() {
    Object.values(this.testDefinitionCreationForm.controls).forEach(
      (control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      }
    );
  }

  isFormValid(): boolean {
    return !this.testDefinitionCreationForm.valid;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  onCancel() {
    this.router.navigate(["../"], { relativeTo: this.route }).then();
  }

  private isValidNumber() {
    return Validators.pattern(/^\d+$/);
  }

  repositorySelected(): boolean {
    return !!this.testDefinitionCreationForm.value["repoId"];
  }

  getRepositoryId(): string {
    return this.testDefinitionCreationForm.value["repoId"];
  }

  getSelectedPath(): string {
    return this.testDefinitionCreationForm.value["path"];
  }

  private resolveTimeoutDuration() {
    return this.testDefinitionCreationForm.value.timeout
      ? this.testDefinitionCreationForm.value.timeout
      : DEFAULT_TIMEOUT_VALUE;
  }

  showErrorMessage(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  private showSuccessMessage(successMessage: string) {
    this.toastMessageService.showSuccess(successMessage);
  }
}
