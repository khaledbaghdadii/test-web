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
import { concatMap, of } from "rxjs";
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
  ],
  providers: [
    QualityGateValidationService,
    SendChangesForReviewService,
    FurtherAnalysisService,
    UpgradeProcessStateUpdaterService,
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

  readonly QualityGateValidationDecision = QualityGateValidationDecision;

  readonly dialogVisible = signal(false);
  readonly loading = signal(false);
  readonly displayedStep = signal<
    "validate-qg" | "keep-environments" | "merge-request"
  >("validate-qg");

  readonly selectedEnvironments = signal<KeepEnvironmentsSelection>({
    environmentIds: [],
    scenarioIds: [],
  });

  readonly keepEnvironmentsMode = signal<"edit" | "readonly">("edit");

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

  readonly hasExistingPassedDecision = computed(
    () => this.validationResult()?.decision === "VALIDATION_PASSED"
  );

  readonly steps = computed<StepDefinition[]>(() => {
    const currentStep = this.displayedStep();

    if (currentStep === "validate-qg") {
      return [
        { id: "validate-qg", title: "Validate QG", status: "active" as const },
        {
          id: "keep-environments",
          title: "Keep Environments",
          status: "inactive" as const,
        },
        {
          id: "merge-request",
          title: "Merge Request",
          status: "inactive" as const,
        },
      ];
    }

    if (currentStep === "keep-environments") {
      return [
        {
          id: "validate-qg",
          title: "Validate QG",
          status: "completed" as const,
        },
        {
          id: "keep-environments",
          title: "Keep Environments",
          status: "active" as const,
        },
        {
          id: "merge-request",
          title: "Merge Request",
          status: "inactive" as const,
        },
      ];
    }

    return [
      {
        id: "validate-qg",
        title: "Validate QG",
        status: "completed" as const,
      },
      {
        id: "keep-environments",
        title: "Keep Environments",
        status: "completed" as const,
      },
      {
        id: "merge-request",
        title: "Merge Request",
        status: "active" as const,
      },
    ];
  });

  readonly dialogHeader = computed(() => {
    switch (this.displayedStep()) {
      case "validate-qg":
        return "Validate Quality Gate";
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
    this.selectedEnvironments.set({ environmentIds: [], scenarioIds: [] });
    this.keepEnvironmentsMode.set("edit");
    this.displayedStep.set("validate-qg");
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

      markResources$
        .pipe(
          concatMap(() =>
            this.sendChangesForReviewService.sendChangesForReview(
              mergeRequestPayload
            )
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.dialogVisible.set(false);
            this.toastMessageService.showSuccess("Changes sent for review.");
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
          concatMap(() => markResources$),
          concatMap(() =>
            this.sendChangesForReviewService.sendChangesForReview(
              mergeRequestPayload
            )
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.dialogVisible.set(false);
            this.toastMessageService.showSuccess("Changes sent for review.");
            this.upgradeProcessStateUpdater.reloadProcessDetails(
              this.processId(),
              this.projectId()
            );
          },
          error: (error) => {
            this.loading.set(false);
            this.toastMessageService.showError(error.message);
            this.upgradeProcessStateUpdater.reloadProcessDetails(
              this.processId(),
              this.projectId()
            );
          },
        });
    }
  }
}
