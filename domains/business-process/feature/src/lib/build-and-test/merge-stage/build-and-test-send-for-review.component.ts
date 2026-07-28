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
  untracked,
} from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
  RepositoryService,
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
import { catchError, map, of } from "rxjs";

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
    RepositoryService,
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
  /** Branch being merged from, used to build a clean "already up-to-date" error message. */
  readonly sourceBranchName = input.required<string>();
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
  private readonly repositoryService = inject(RepositoryService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitLoading = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly backportDefinitionsLoading = signal(false);
  readonly backportMergeConfigurationsLoading = signal(false);
  readonly backportDefinitionsLoaded = signal(false);
  readonly backportMergeConfigurationsLoaded = signal(false);

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

  private readonly repositoryNameResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      repositoryId: this.repositoryId(),
    }),
    stream: ({ params }) =>
      this.repositoryService
        .getRepository(params.projectId, params.repositoryId)
        .pipe(
          map((repository) => repository.name),
          catchError(() => of(undefined))
        ),
  });

  private readonly repositoryName = computed(
    () => this.repositoryNameResource.value() ?? this.repositoryId()
  );

  constructor() {
    effect(() => {
      if (this.visible()) {
        untracked(() => this.loadBackportOptionsIfNeeded());
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
    this.submitError.set(null);

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
    const backportInputs = this.resolveBackportInputs(
      formValue.backport,
      formValue.backportDefinitions
    );
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
        backportInputs,
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
    this.submitError.set(null);
  }

  private proceedWithPredefinedInputs(): void {
    this.submitError.set(null);
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
    this.submitError.set(this.normalizeSubmitError(message));
  }

  /**
   * The SCM layer surfaces a raw, serialized conflict error (exception class
   * name, retry metadata, nested details) when the source branch has no new
   * commits to merge into the destination branch. Replace it with a single,
   * user-friendly sentence; any other error message is left untouched.
   */
  private normalizeSubmitError(message: string): string {
    if (!this.isBranchAlreadyUpToDateError(message)) return message;

    const destinationBranchName =
      this.form.controls.destinationBranch.value?.branchName ??
      this.parentBranchName();

    return `Branch "${this.sourceBranchName()}" is already up-to-date with branch "${destinationBranchName}" in repository "${this.repositoryName()}"`;
  }

  private isBranchAlreadyUpToDateError(message: string): boolean {
    return /up[- ]?to[- ]?date|emptypullrequestexception|empty_merge_request/i.test(
      message
    );
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
    if (this.backportDefinitionsLoaded() || this.backportDefinitionsLoading()) {
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
            (definition) =>
              definition.sourceDefinitionId === "on-demand-backport"
          )
        );
        this.backportDefinitionsLoading.set(false);
        this.backportDefinitionsLoaded.set(true);
      });
  }

  private loadBackportMergeConfigurations(): void {
    if (
      this.backportMergeConfigurationsLoaded() ||
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
        this.backportMergeConfigurationsLoaded.set(true);
      });
  }

  private resolveBackportInputs(
    backport: boolean,
    backportDefinitions: BusinessProcessDefinition[]
  ) {
    if (!backport) {
      return [];
    }
    if (this.ciVersion() === 2) {
      return this.extractBackportInputs(backportDefinitions);
    }
    return undefined;
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
    this.submitError.set(null);
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
