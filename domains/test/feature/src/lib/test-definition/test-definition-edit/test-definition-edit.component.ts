import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { concatMap, Subject, takeUntil } from "rxjs";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { ActivatedRoute, Router } from "@angular/router";
import { WhitespaceValidators } from "@mxflow/validator";
import { CommonModule, Location } from "@angular/common";
import { ConfirmationService } from "primeng/api";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";
import { CardContainerModule } from "@mxflow/ui/container";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { InputTextModule } from "primeng/inputtext";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { EditTestDefinitionRequest } from "@mxevolve/domains/test/model";
import { TestSequenceSingleSelectorComponent } from "@mxevolve/domains/test/widget";
import { TestPackageDirectoryPickerComponent } from "@mxevolve/domains/test/composite-widget";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

const TEST_OBJECTS_FEATURE_FLAG = "test-objects";

@Component({
  selector: "mxevolve-test-definition-edit",
  templateUrl: "./test-definition-edit.component.html",
  imports: [
    CommonModule,
    MxflowSpinnerModule,
    MandatoryFieldModule,
    CardContainerModule,
    ButtonModule,
    ReactiveFormsModule,
    SelectModule,
    ConfirmPopupModule,
    HeaderTitleModule,
    InputTextModule,
    TestSequenceSingleSelectorComponent,
    TestPackageDirectoryPickerComponent,
  ],
})
export class TestDefinitionEditComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private repositoryService = inject(RepositoryService);
  private testDefinitionService = inject(TestDefinitionService);
  private store = inject(Store);
  private confirmationService = inject(ConfirmationService);
  private toastMessageService = inject(ToastMessageService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);

  private readonly destroy$ = new Subject();

  projectId: string;
  testDefinitionId: string;
  isLoading = false;
  useTestSequenceSelector = false;
  repositories: Repository[];

  testDefinitionEditForm: FormGroup;

  ngOnInit(): void {
    this.isLoading = true;
    this.testDefinitionEditForm = this.fb.group({
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
      timeout: [null, [WhitespaceValidators.notBlank(), this.isValidNumber()]],
    });

    this.route.params
      .pipe(
        concatMap((routeMaps) => {
          this.testDefinitionId = routeMaps["testDefinitionId"];
          return this.store.select(GlobalSelectors.getProjectId);
        }),
        concatMap((projectId) => {
          this.projectId = projectId;
          this.featureFlagResolver
            .isFeatureEnabled(projectId, TEST_OBJECTS_FEATURE_FLAG)
            .then((enabled) => (this.useTestSequenceSelector = enabled))
            .catch(() => (this.useTestSequenceSelector = false));
          return this.repositoryService.getTestRepositories(this.projectId);
        }),
        concatMap((repositories) => {
          this.repositories = repositories;
          return this.testDefinitionService.fetch(
            this.testDefinitionId,
            this.projectId
          );
        })
      )
      .subscribe({
        next: (testDefinition) => {
          this.testDefinitionEditForm.controls["repoId"].setValue(
            testDefinition.repoId
          );
          this.testDefinitionEditForm.controls["repoId"].disable();
          this.testDefinitionEditForm.controls["path"].setValue(
            this.resolveInitialPath(testDefinition.path)
          );
          this.testDefinitionEditForm.controls["description"].setValue(
            testDefinition.description
          );
          this.testDefinitionEditForm.controls["timeout"].setValue(
            this.getTimeoutInHours(testDefinition.timeoutDuration)
          );

          this.isLoading = false;
        },
        error: (err) => {
          this.showErrorMessage(err);
          this.isLoading = false;
        },
      });
  }

  confirmSubmit(event: Event) {
    this.confirmationService.confirm({
      acceptLabel: "OK",
      rejectLabel: "Cancel",
      target: event.target ? event.target : undefined,
      message:
        "If you updated the package path, make sure to update the test selections if needed.",
      icon: "pi pi-exclamation-triangle",
      accept: () => this.submit(),
      reject: () => {},
    });
  }

  submit() {
    if (this.testDefinitionEditForm.valid) {
      this.isLoading = true;
      this.testDefinitionService
        .edit(
          this.projectId,
          this.testDefinitionId,
          this.getEditTestDefinitionRequest()
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.showSuccessMessage("Test Definition Successfully Edited");
            this.router
              .navigate(["../../details", this.testDefinitionId], {
                relativeTo: this.route,
              })
              .then();
          },
          error: (err) => {
            this.showErrorMessage(err);
            this.isLoading = false;
          },
        });
    } else {
      this.showInvalidInputs();
    }
  }

  private getEditTestDefinitionRequest(): EditTestDefinitionRequest {
    const name = this.resolveName();
    return {
      name,
      repoId: this.testDefinitionEditForm.get("repoId")?.getRawValue(),
      path: this.resolvePath(name),
      description: this.testDefinitionEditForm.value["description"],
      timeoutDuration: {
        days: 0,
        hours: this.getHours(),
        minutes: 0,
      },
    };
  }

  private resolveInitialPath(fullPath: string): string {
    return this.useTestSequenceSelector
      ? fullPath.split("/").at(-1) ?? fullPath
      : fullPath;
  }

  private resolveName(): string {
    const formPath = this.testDefinitionEditForm.value["path"];
    return this.useTestSequenceSelector
      ? formPath
      : formPath.split("/").at(-1) ?? formPath;
  }

  private resolvePath(name: string): string {
    return this.useTestSequenceSelector
      ? `common/mxtest/test_packages/${name}`
      : this.testDefinitionEditForm.value["path"];
  }

  private getHours() {
    return this.testDefinitionEditForm.value.timeout
      ? this.testDefinitionEditForm.value.timeout
      : 24;
  }

  private showInvalidInputs() {
    Object.values(this.testDefinitionEditForm.controls).forEach((control) => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  onCancel() {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private getTimeoutInHours(timeoutDuration: {
    days: number;
    hours: number;
    minutes: number;
  }) {
    const { days, hours, minutes } = timeoutDuration;
    return days * 24 + hours + minutes / 60;
  }

  private isValidNumber() {
    return Validators.pattern(/^\d+$/);
  }

  repositorySelected(): boolean {
    return !!this.testDefinitionEditForm.get("repoId")?.getRawValue();
  }

  getRepositoryId(): string {
    return this.testDefinitionEditForm.get("repoId")?.getRawValue();
  }

  getSelectedPath(): string {
    return this.testDefinitionEditForm.value["path"];
  }

  isFormValid(): boolean {
    return !this.testDefinitionEditForm.valid;
  }

  showErrorMessage(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  private showSuccessMessage(successMessage: string) {
    this.toastMessageService.showSuccess(successMessage);
  }
}
