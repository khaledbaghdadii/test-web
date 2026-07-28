import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { concatMap, map, of, Observable } from "rxjs";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import {
  StepperComponent,
  StepComponent,
  StepDefinition,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  FurtherAnalysisService,
  QualityGateValidationService,
  SendChangesForReviewService,
  UpgradeProcessStateUpdaterService,
  FactoryProductUpdateService,
  FactoryProductUserAction,
  UpdateFactoryProductResponse,
} from "@mxevolve/domains/business-process/data-access";
import {
  QualityGateValidationDecision,
  QualityGateValidationResult,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import { QualityGateValidationFormComponent } from "../quality-gate-validation-form/quality-gate-validation-form.component";
import type { QualityGateValidationValue } from "../quality-gate-validation-form/quality-gate-validation-form.component";
import {
  MergeRequestDetailsFormComponent,
  MergeRequestDetailsValue,
} from "../merge-request-details-form/merge-request-details-form.component";
import {
  KeepEnvironmentsTableComponent,
  KeepEnvironmentsSelection,
} from "../keep-environments-table/keep-environments-table.component";
import {
  FactoryProductSubmissionFormComponent,
  FactoryProductSubmissionValue,
} from "../factory-product-submission-form/factory-product-submission-form.component";

@Component({
  selector: "mxevolve-proceed-from-quality-gate-wizard",
  templateUrl: "./proceed-from-quality-gate-wizard.component.html",
  imports: [
    Button,
    Dialog,
    ReactiveFormsModule,
    StepperComponent,
    StepComponent,
    QualityGateValidationFormComponent,
    MergeRequestDetailsFormComponent,
    KeepEnvironmentsTableComponent,
    FactoryProductSubmissionFormComponent,
  ],
  providers: [
    QualityGateValidationService,
    SendChangesForReviewService,
    FurtherAnalysisService,
    UpgradeProcessStateUpdaterService,
    FactoryProductUpdateService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProceedFromQualityGateWizardComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly developmentId = input.required<string>();
  readonly supportsResourceManagement = input.required<boolean>();
  readonly parentBranchName = input.required<string>();
  readonly stageStatus = input.required<StageStatus>();
  readonly validationResult = input<QualityGateValidationResult | undefined>();
  readonly keptResourcesDecisionMade = input.required<boolean>();
  readonly initialFactoryProductId = input<string | undefined>(undefined);

  private readonly qualityGateService = inject(QualityGateValidationService);
  private readonly sendChangesForReviewService = inject(
    SendChangesForReviewService
  );
  private readonly furtherAnalysisService = inject(FurtherAnalysisService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly upgradeProcessStateUpdater = inject(
    UpgradeProcessStateUpdaterService
  );
  private readonly factoryProductUpdateService = inject(
    FactoryProductUpdateService
  );

  private step(
    id: string,
    title: string,
    status: "active" | "completed" | "inactive"
  ): StepDefinition {
    return { id, title, status };
  }

  readonly QualityGateValidationDecision = QualityGateValidationDecision;

  readonly dialogVisible = signal(false);
  readonly loading = signal(false);
  readonly displayedStep = signal<
    "validate-qg" | "factory-product" | "keep-environments" | "merge-request"
  >("validate-qg");

  readonly selectedEnvironments = signal<KeepEnvironmentsSelection>({
    environmentIds: [],
    scenarioIds: [],
  });

  readonly keepEnvironmentsMode = signal<"edit" | "readonly">("edit");

  readonly factoryProductMode = signal<"edit" | "readonly">("edit");

  readonly buttonDisabled = computed(
    () => this.stageStatus() !== StageStatus.PENDING_INPUT
  );

  readonly qualityGateValidationControl =
    new FormControl<QualityGateValidationValue | null>(null);

  private readonly qualityGateValidationValue = toSignal(
    this.qualityGateValidationControl.valueChanges,
    { initialValue: null }
  );

  readonly validationDecision = computed(
    () => this.qualityGateValidationValue()?.validationDecision ?? null
  );

  readonly mergeRequestControl =
    new FormControl<MergeRequestDetailsValue | null>(null);

  readonly factoryProductSubmissionControl =
    new FormControl<FactoryProductSubmissionValue | null>(null);

  readonly hasExistingPassedDecision = computed(
    () => this.validationResult()?.decision === "VALIDATION_PASSED"
  );

  readonly steps = computed<StepDefinition[]>(() => {
    const currentStep = this.displayedStep();

    if (currentStep === "validate-qg") {
      return [
        this.step("validate-qg", "Validate QG", "active"),
        this.step("factory-product", "Factory Product Submission", "inactive"),
        this.step("keep-environments", "Keep Environments", "inactive"),
        this.step("merge-request", "Merge Request", "inactive"),
      ];
    }

    if (currentStep === "factory-product") {
      return [
        this.step("validate-qg", "Validate QG", "completed"),
        this.step("factory-product", "Factory Product Submission", "active"),
        this.step("keep-environments", "Keep Environments", "inactive"),
        this.step("merge-request", "Merge Request", "inactive"),
      ];
    }

    if (currentStep === "keep-environments") {
      return [
        this.step("validate-qg", "Validate QG", "completed"),
        this.step("factory-product", "Factory Product Submission", "completed"),
        this.step("keep-environments", "Keep Environments", "active"),
        this.step("merge-request", "Merge Request", "inactive"),
      ];
    }

    return [
      this.step("validate-qg", "Validate QG", "completed"),
      this.step("factory-product", "Factory Product Submission", "completed"),
      this.step("keep-environments", "Keep Environments", "completed"),
      this.step("merge-request", "Merge Request", "active"),
    ];
  });

  readonly dialogHeader = computed(() => {
    switch (this.displayedStep()) {
      case "validate-qg":
        return "Validate Quality Gate";
      case "factory-product":
        return "Factory Product Submission";
      case "keep-environments":
        return "Keep Environments";
      case "merge-request":
        return "Merge Request";
    }
  });

  openDialog(): void {
    if (this.hasExistingPassedDecision()) {
      this.restorePassedDecision();
    } else {
      this.initializeNewDecision();
    }
    this.loading.set(false);
    this.dialogVisible.set(true);
  }

  private restorePassedDecision(): void {
    const result = this.validationResult()!;
    this.qualityGateValidationControl.setValue({
      validationDecision: result.decision,
      comment: result.comment ?? "",
      deleteBranch: null,
    });
    this.qualityGateValidationControl.disable();

    this.loadFactoryProductState();

    if (this.keptResourcesDecisionMade()) {
      this.keepEnvironmentsMode.set("readonly");
      this.displayedStep.set("merge-request");
    } else {
      this.keepEnvironmentsMode.set("edit");
      this.displayedStep.set("keep-environments");
    }
  }

  private initializeNewDecision(): void {
    this.qualityGateValidationControl.reset();
    this.qualityGateValidationControl.enable();
    this.mergeRequestControl.reset();
    this.factoryProductSubmissionControl.reset();
    this.selectedEnvironments.set({ environmentIds: [], scenarioIds: [] });
    this.keepEnvironmentsMode.set("edit");
    this.factoryProductMode.set("edit");
    this.displayedStep.set("validate-qg");
    this.loadFactoryProductState();
  }

  goToFactoryProduct(): void {
    this.displayedStep.set("factory-product");
  }

  private loadFactoryProductState(): void {
    this.factoryProductUpdateService
      .getFactoryProductUpdates(this.projectId(), this.processId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.restoreFactoryProductState(response.actions),
        error: () => this.applySystemSuggestedFactoryProductState(),
      });
  }

  private restoreFactoryProductState(
    actions: FactoryProductUserAction[]
  ): void {
    const latest = actions.at(0);

    if (!latest) {
      this.applySystemSuggestedFactoryProductState();
      return;
    }

    switch (latest.actionType) {
      case "SUBMIT_FAP":
        this.restoreSubmitFapState(latest);
        return;
      case "SKIP_FAP_UPDATE":
        this.restoreSkipFapUpdateState(latest);
        return;
      default:
        this.applySystemSuggestedFactoryProductState();
    }
  }

  private restoreSubmitFapState(action: FactoryProductUserAction): void {
    switch (action.status) {
      case "SUCCESS":
        this.factoryProductMode.set("readonly");
        this.factoryProductSubmissionControl.setValue(
          this.toPrefilledSubmissionValue(action)
        );
        return;
      case "FAILURE":
        this.factoryProductMode.set("edit");
        this.factoryProductSubmissionControl.setValue(
          this.toPrefilledSubmissionValue(action)
        );
        return;
      case "NA":
        this.applySystemSuggestedFactoryProductState();
        return;
    }
  }

  private restoreSkipFapUpdateState(action: FactoryProductUserAction): void {
    switch (action.status) {
      case "SUCCESS":
        this.factoryProductMode.set("readonly");
        this.factoryProductSubmissionControl.setValue(
          this.toSkippedSubmissionValue()
        );
        return;
      case "FAILURE":
        this.factoryProductMode.set("edit");
        this.factoryProductSubmissionControl.setValue(
          this.toSkippedSubmissionValue()
        );
        return;
      case "NA":
        this.applySystemSuggestedFactoryProductState();
        return;
    }
  }

  private applySystemSuggestedFactoryProductState(): void {
    this.factoryProductMode.set("edit");
    this.factoryProductSubmissionControl.setValue(
      this.systemSuggestedSubmissionValue()
    );
  }

  private systemSuggestedSubmissionValue(): FactoryProductSubmissionValue {
    return {
      factoryProductId: this.initialFactoryProductId(),
      commitMessage: "",
      selectedConfigurationFilePaths: [],
      skipSubmission: false,
    };
  }

  private toSkippedSubmissionValue(): FactoryProductSubmissionValue {
    return {
      ...this.systemSuggestedSubmissionValue(),
      skipSubmission: true,
    };
  }

  private toPrefilledSubmissionValue(
    action: FactoryProductUserAction
  ): FactoryProductSubmissionValue {
    return {
      factoryProductId:
        (action.details["factoryProductId"] as string | undefined) ??
        this.initialFactoryProductId(),
      commitMessage: (action.details["commitMessage"] as string) ?? "",
      selectedConfigurationFilePaths: this.extractFilePaths(action),
      skipSubmission: false,
    };
  }

  private extractFilePaths(action: FactoryProductUserAction): string[] {
    const files = action.details["files"];
    if (!Array.isArray(files)) {
      return [];
    }
    return files
      .map(
        (f) => (f as { configurationFilePath?: string }).configurationFilePath
      )
      .filter((path): path is string => !!path);
  }

  goToKeepEnvironments(): void {
    this.displayedStep.set("keep-environments");
  }

  goToMergeRequest(): void {
    this.displayedStep.set("merge-request");
  }

  goBackToKeepEnvironments(): void {
    if (this.keptResourcesDecisionMade()) {
      this.keepEnvironmentsMode.set("readonly");
    }
    this.displayedStep.set("keep-environments");
  }

  goBackToValidateQg(): void {
    this.displayedStep.set("validate-qg");
  }

  onSelectionChanged(selection: KeepEnvironmentsSelection): void {
    this.selectedEnvironments.set(selection);
  }

  submitFailedAndStop(): void {
    this.loading.set(true);
    const qgValue = this.qualityGateValidationControl.value;
    this.qualityGateService
      .markQualityGateFailed({
        projectId: this.projectId(),
        processId: this.processId(),
        shouldCleanDevelopment: qgValue?.deleteBranch?.shouldDelete ?? false,
        developmentId: qgValue?.deleteBranch?.developmentId,
        comment: qgValue?.comment ?? undefined,
        supportsResourceManagement: this.supportsResourceManagement(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogVisible.set(false);
          this.toastMessageService.showSuccess(
            "Quality gate marked as failed."
          );
          this.upgradeProcessStateUpdater.reloadProcessDetails(
            this.processId(),
            this.projectId()
          );
        },
        error: (error) => {
          this.loading.set(false);
          this.toastMessageService.showError(error.message);
        },
      });
  }

  submitSendForReview(): void {
    this.loading.set(true);
    const mrValue = this.mergeRequestControl.value!;

    const mergeRequestPayload = {
      projectId: this.projectId(),
      processId: this.processId(),
      mergeJobTitle: mrValue.mergeRequestTitle,
      mergeConfigurationId: mrValue.destinationBranch!.id,
      mergeJobReviewers: mrValue.reviewers.map((r) => r.name),
      shouldCleanDevelopment: mrValue.deleteBranch?.shouldDelete ?? false,
      developmentId: this.developmentId(),
      supportsResourceManagement: this.supportsResourceManagement(),
    };

    const selection = this.selectedEnvironments();
    const shouldMarkResources =
      !this.keptResourcesDecisionMade() &&
      (selection.environmentIds.length > 0 || selection.scenarioIds.length > 0);

    const factoryProductUpdate$ = this.buildFactoryProductUpdate$();

    if (this.hasExistingPassedDecision()) {
      const markResources$ = shouldMarkResources
        ? this.furtherAnalysisService.markResourcesForFurtherAnalysis(
            this.projectId(),
            this.processId(),
            {
              environmentIds: selection.environmentIds,
              scenarioIds: selection.scenarioIds,
            }
          )
        : of(undefined);

      factoryProductUpdate$
        .pipe(
          concatMap(() => markResources$),
          concatMap(() =>
            this.sendChangesForReviewService.sendChangesForReview(
              mergeRequestPayload
            )
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: () => this.onSendForReviewSuccess(),
          error: (error) => this.onSendForReviewError(error),
        });
    } else {
      const markQgPassed$ = this.qualityGateService.markQualityGatePassed(
        this.projectId(),
        this.processId(),
        this.qualityGateValidationControl.value?.comment || undefined
      );

      const markResources$ = shouldMarkResources
        ? this.furtherAnalysisService.markResourcesForFurtherAnalysis(
            this.projectId(),
            this.processId(),
            {
              environmentIds: selection.environmentIds,
              scenarioIds: selection.scenarioIds,
            }
          )
        : of(undefined);

      markQgPassed$
        .pipe(
          concatMap(() => factoryProductUpdate$),
          concatMap(() => markResources$),
          concatMap(() =>
            this.sendChangesForReviewService.sendChangesForReview(
              mergeRequestPayload
            )
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: () => this.onSendForReviewSuccess(),
          error: (error) => this.onSendForReviewError(error, true),
        });
    }
  }

  private buildFactoryProductUpdate$(): Observable<unknown> {
    if (this.factoryProductMode() === "readonly") {
      return of(undefined);
    }

    const value = this.factoryProductSubmissionControl.value;
    if (!value) {
      return of(undefined);
    }

    return this.factoryProductUpdateService
      .updateFactoryProduct({
        projectId: this.projectId(),
        processId: this.processId(),
        factoryProductId: value.factoryProductId ?? "",
        commitMessage: value.commitMessage,
        filesToUpdate: value.selectedConfigurationFilePaths,
        skipUpdate: value.skipSubmission,
      })
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(this.buildFileFailureMessage(response));
          }
          return response;
        })
      );
  }

  private buildFileFailureMessage(
    response: UpdateFactoryProductResponse
  ): string {
    return response.files
      .filter((file) => file.status === "FAILURE")
      .map((file) => `${file.configurationFilePath}: ${file.failureMessage}`)
      .join("\n");
  }

  private onSendForReviewSuccess(): void {
    this.loading.set(false);
    this.dialogVisible.set(false);
    this.toastMessageService.showSuccess("Changes sent for review.");
    this.upgradeProcessStateUpdater.reloadProcessDetails(
      this.processId(),
      this.projectId()
    );
  }

  private onSendForReviewError(error: Error, reloadProcess = false): void {
    this.loading.set(false);
    this.toastMessageService.showError(error.message);

    if (reloadProcess) {
      this.upgradeProcessStateUpdater.reloadProcessDetails(
        this.processId(),
        this.projectId()
      );
    }
  }
}
