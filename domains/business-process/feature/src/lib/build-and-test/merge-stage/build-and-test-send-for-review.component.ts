import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  BuildAndTestUserInputService,
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
} from "@mxevolve/domains/business-process/data-access";
import {
  DeleteDevelopmentCheckboxComponent,
  DeleteDevelopmentValue,
} from "@mxevolve/domains/business-process/widget";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import {
  MergeConfiguration,
  MergeConfigurationService,
  Reviewer,
} from "@mxevolve/domains/scm/data-access";
import {
  MergeConfigurationDropdownComponent,
  ReviewersAutoCompleteComponent,
} from "@mxevolve/domains/scm/widget";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { Message } from "primeng/message";
import { MultiSelectModule } from "primeng/multiselect";
import { RadioButton } from "primeng/radiobutton";
import { catchError, of } from "rxjs";

@Component({
  selector: "mxevolve-build-and-test-send-for-review",
  imports: [
    Button,
    Dialog,
    DeleteDevelopmentCheckboxComponent,
    InputText,
    MergeConfigurationDropdownComponent,
    Message,
    MultiSelectModule,
    MxevolveIconComponent,
    RadioButton,
    ReactiveFormsModule,
    ReviewersAutoCompleteComponent,
  ],
  providers: [
    BuildAndTestUserInputService,
    BusinessProcessDefinitionService,
    MergeConfigurationService,
  ],
  templateUrl: "./build-and-test-send-for-review.component.html",
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestSendForReviewComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly developmentId = input.required<string>();
  readonly parentBranchName = input.required<string>();
  readonly supportsResourceManagement = input.required<boolean>();
  readonly hasPredefinedMergeRequestInputs = input.required<boolean>();
  readonly ciVersion = input.required<number>();

  readonly visible = model(false);
  readonly mergeRequestCreated = output<void>();

  private readonly userInputService = inject(BuildAndTestUserInputService);
  private readonly definitionService = inject(BusinessProcessDefinitionService);
  private readonly mergeConfigurationService = inject(
    MergeConfigurationService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitLoading = signal(false);
  readonly backportDefinitionsLoading = signal(false);
  readonly backportMergeConfigurationsLoading = signal(false);

  readonly backportDefinitions = signal<BusinessProcessDefinition[]>([]);
  readonly backportMergeConfigurations = signal<MergeConfiguration[]>([]);

  readonly form = new FormGroup({
    mergeRequestTitle: new FormControl<string>("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(255),
        Validators.pattern(/\S/),
      ],
    }),
    destinationBranch: new FormControl<MergeConfiguration | null>(
      null,
      Validators.required
    ),
    reviewers: new FormControl<Reviewer[]>([], { nonNullable: true }),
    backport: new FormControl<boolean>(false, { nonNullable: true }),
    backportMergeConfigurations: new FormControl<MergeConfiguration[]>([], {
      nonNullable: true,
    }),
    backportDefinitions: new FormControl<BusinessProcessDefinition[]>([], {
      nonNullable: true,
    }),
    deleteBranch: new FormControl<DeleteDevelopmentValue | null>(null),
  });

  readonly predefinedMode = computed(() =>
    this.hasPredefinedMergeRequestInputs()
  );

  protected readonly ExecutionFamily = ExecutionFamily;

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.loadBackportOptionsIfNeeded();
      }
    });

    this.form.controls.backport.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((backport) => {
        this.updateBackportValidators(backport);
        if (backport) {
          this.loadBackportOptionsIfNeeded();
        }
      });

    effect(() => {
      const parentBranchName = this.parentBranchName();
      const repositoryId = this.repositoryId();
      const projectId = this.projectId();
      if (!parentBranchName || !repositoryId || !projectId) return;

      this.mergeConfigurationService
        .getFilteredMergeConfigurations(
          projectId,
          repositoryId,
          parentBranchName,
          0,
          100
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (page) => {
            const match =
              page.content.find(
                (config) => config.branchName === parentBranchName
              ) ?? page.content.at(0);
            if (match && !this.form.controls.destinationBranch.value) {
              this.form.controls.destinationBranch.setValue(match);
            }
          },
          error: (error) => {
            this.toastMessageService.showError(error.message);
          },
        });
    });
  }

  submit(): void {
    if (this.predefinedMode()) {
      this.proceedWithPredefinedInputs();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    this.submitLoading.set(true);
    this.userInputService
      .sendChangesForReview({
        projectId: this.projectId(),
        processId: this.processId(),
        mergeConfigurationId: formValue.destinationBranch!.id,
        mergeJobTitle: formValue.mergeRequestTitle,
        mergeJobReviewers: formValue.reviewers.map((reviewer) => reviewer.name),
        backportChanges: formValue.backport,
        backportMergeConfigurationIds:
          formValue.backport && this.ciVersion() === 1
            ? formValue.backportMergeConfigurations.map((config) => config.id)
            : undefined,
        backportInputs:
          formValue.backport && this.ciVersion() === 2
            ? this.extractBackportInputs(formValue.backportDefinitions)
            : formValue.backport
            ? undefined
            : [],
        shouldCleanDevelopment: this.shouldCleanDevelopment(),
        developmentId: this.developmentId(),
        supportsResourceManagement: this.supportsResourceManagement(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.handleSuccess(),
        error: (error) => this.handleError(error.message),
      });
  }

  cancel(): void {
    this.visible.set(false);
    this.resetForm();
  }

  private proceedWithPredefinedInputs(): void {
    this.submitLoading.set(true);
    this.userInputService
      .proceedWithPredefinedInputs({
        projectId: this.projectId(),
        processId: this.processId(),
        shouldCleanDevelopment: this.shouldCleanDevelopment(),
        developmentId: this.developmentId(),
        supportsResourceManagement: this.supportsResourceManagement(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.handleSuccess(),
        error: (error) => this.handleError(error.message),
      });
  }

  private handleSuccess(): void {
    this.submitLoading.set(false);
    this.visible.set(false);
    this.toastMessageService.showSuccess("Changes sent for review.");
    this.mergeRequestCreated.emit();
    this.resetForm();
  }

  private handleError(message: string): void {
    this.submitLoading.set(false);
    this.toastMessageService.showError(message);
  }

  private updateBackportValidators(backport: boolean): void {
    const v1Control = this.form.controls.backportMergeConfigurations;
    const v2Control = this.form.controls.backportDefinitions;

    v1Control.clearValidators();
    v2Control.clearValidators();

    if (backport && this.ciVersion() === 1) {
      v1Control.setValidators(Validators.required);
      v2Control.setValue([]);
    } else if (backport) {
      v2Control.setValidators(Validators.required);
      v1Control.setValue([]);
    } else {
      v1Control.setValue([]);
      v2Control.setValue([]);
    }

    v1Control.updateValueAndValidity();
    v2Control.updateValueAndValidity();
  }

  private loadBackportOptionsIfNeeded(): void {
    if (this.ciVersion() === 1) {
      this.loadBackportMergeConfigurations();
    } else {
      this.loadBackportDefinitions();
    }
  }

  private loadBackportDefinitions(): void {
    if (this.backportDefinitions().length > 0 || this.backportDefinitionsLoading()) {
      return;
    }

    this.backportDefinitionsLoading.set(true);
    this.definitionService
      .getBusinessProcessDefinitions({
        projectId: this.projectId(),
        executable: true,
        extendable: false,
      })
      .pipe(
        catchError((error) => {
          this.toastMessageService.showError(error.message);
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((definitions) => {
        this.backportDefinitions.set(
          definitions.filter(
            (definition) => definition.sourceDefinitionId === "on-demand-backport"
          )
        );
        this.backportDefinitionsLoading.set(false);
      });
  }

  private loadBackportMergeConfigurations(): void {
    if (
      this.backportMergeConfigurations().length > 0 ||
      this.backportMergeConfigurationsLoading()
    ) {
      return;
    }

    this.backportMergeConfigurationsLoading.set(true);
    this.mergeConfigurationService
      .getFilteredMergeConfigurations(
        this.projectId(),
        this.repositoryId(),
        "",
        0,
        200
      )
      .pipe(
        catchError((error) => {
          this.toastMessageService.showError(error.message);
          return of({
            content: [],
            totalPages: 0,
            totalElements: 0,
            size: 0,
            number: 0,
            last: true,
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((page) => {
        this.backportMergeConfigurations.set(page.content);
        this.backportMergeConfigurationsLoading.set(false);
      });
  }

  private extractBackportInputs(definitions: BusinessProcessDefinition[]) {
    return definitions.map((definition) => ({
      definitionId: definition.id,
      repositoryId: this.getProvidedInput(definition, "repositoryId"),
      mergeConfigurationId: this.getProvidedInput(
        definition,
        "mergeConfigurationId"
      ),
      buildAndTestInfraGroupId: this.getProvidedInput(
        definition,
        "buildAndTestInfraGroup"
      ),
    }));
  }

  private getProvidedInput(
    definition: BusinessProcessDefinition,
    inputId: string
  ): string {
    const inputValue = definition.providedInputs.find(
      (input) => input.inputId === inputId
    )?.value;
    return inputValue?.toString() ?? "";
  }

  private shouldCleanDevelopment(): boolean {
    return this.form.controls.deleteBranch.value?.shouldDelete ?? true;
  }

  private resetForm(): void {
    this.form.reset({
      mergeRequestTitle: "",
      destinationBranch: null,
      reviewers: [],
      backport: false,
      backportMergeConfigurations: [],
      backportDefinitions: [],
      deleteBranch: null,
    });
  }
}
