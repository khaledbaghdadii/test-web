import { Component, computed, inject, input, signal } from "@angular/core";
import {
  BusinessProcessContentContainerComponent,
  QualityGateValidationBannerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  ValidationProcessExecuteQualityGateStage,
  ValidationProcessMarkQualityGateFailedRequest,
  ValidationProcessMarkQualityGatePassedRequest,
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { QualityGateValidationDecision } from "@mxevolve/domains/business-process/util";
import { Message } from "primeng/message";
import { Button } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { Dialog } from "primeng/dialog";
import { Textarea } from "primeng/textarea";
import { Checkbox } from "primeng/checkbox";
import { RadioButton } from "primeng/radiobutton";
import { Chip } from "primeng/chip";
import {
  ScenarioRunsComponent,
  ScenarioRunsSummaryComponent,
  SummaryFilterEvent,
} from "@mxevolve/domains/test/widget";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";

@Component({
  selector: "mxevolve-validation-process-execute-quality-gates-stage",
  templateUrl: "./execute-quality-gates-stage.component.html",
  host: {
    style: "display: contents;",
  },
  imports: [
    StageContainerComponent,
    BusinessProcessContentContainerComponent,
    QualityGateValidationBannerComponent,
    Message,
    Button,
    FormsModule,
    Dialog,
    Textarea,
    Checkbox,
    RadioButton,
    ScenarioRunsComponent,
    ScenarioRunsSummaryComponent,
    Chip,
    ShowElementIfAuthorizedDirective,
  ],
})
export class ValidationProcessExecuteQualityGatesStageComponent {
  readonly stage = input.required<ValidationProcessExecuteQualityGateStage>();
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly processName = input.required<string>();
  readonly developmentId = input.required<string>();
  readonly finalProductId = input<string>();
  readonly branch = input<string>();
  showRefreshInfo = signal(false);

  private readonly stateUpdater = inject(ValidationProcessStateUpdaterService);

  readonly allowOfficialRerun = computed(() => !!this.finalProductId());

  readonly activeFilters = signal<SummaryFilterEvent[]>([]);

  readonly showValidateDialog = signal(false);
  readonly validateDecision = signal<QualityGateValidationDecision>(
    QualityGateValidationDecision.VALIDATION_PASSED
  );
  readonly comment = signal("");
  readonly shouldDeleteBranch = signal(false);
  readonly isSubmitting = signal(false);

  readonly QualityGateValidationDecision = QualityGateValidationDecision;

  readonly stageIsNotWaitingForValidation = computed(() => {
    const s = this.stage();
    return (
      !!s.validationResult ||
      s.status !== ValidationProcessStageStatus.PENDING_INPUT
    );
  });

  toggleFilter(event: SummaryFilterEvent): void {
    this.activeFilters.update((filters) => {
      const idx = filters.findIndex(
        (f) => f.type === event.type && f.value === event.value
      );
      return idx >= 0
        ? filters.filter((_, i) => i !== idx)
        : [...filters, event];
    });
  }

  removeFilter(filter: SummaryFilterEvent): void {
    this.activeFilters.update((filters) =>
      filters.filter(
        (f) => !(f.type === filter.type && f.value === filter.value)
      )
    );
  }

  onScenarioChanged(): void {
    this.activeFilters.set([]);
    this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId());
  }

  openValidateDialog(): void {
    this.comment.set("");
    this.shouldDeleteBranch.set(false);
    this.validateDecision.set(QualityGateValidationDecision.VALIDATION_PASSED);
    this.showValidateDialog.set(true);
  }

  submitValidation(): void {
    this.isSubmitting.set(true);
    if (
      this.validateDecision() ===
      QualityGateValidationDecision.VALIDATION_PASSED
    ) {
      const request: ValidationProcessMarkQualityGatePassedRequest = {
        projectId: this.projectId(),
        executionId: this.processId(),
        comment: this.comment(),
      };
      this.stateUpdater.markQualityGatePassed(request).subscribe({
        next: () => {
          this.showValidateDialog.set(false);
          this.isSubmitting.set(false);
          this.stateUpdater.reloadProcessDetails(
            this.processId(),
            this.projectId()
          );
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
    } else {
      const request: ValidationProcessMarkQualityGateFailedRequest = {
        projectId: this.projectId(),
        executionId: this.processId(),
        comment: this.comment(),
        developmentId: this.developmentId(),
        shouldCleanDevelopment: this.shouldDeleteBranch(),
      };
      this.stateUpdater.markQualityGateFailed(request).subscribe({
        next: () => {
          this.showValidateDialog.set(false);
          this.isSubmitting.set(false);
          this.stateUpdater.reloadProcessDetails(
            this.processId(),
            this.projectId()
          );
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
    }
  }

  handleScenarioRunsFetched(headScenarioRunIds: string[]) {
    if (headScenarioRunIds.length == 0) {
      this.showRefreshInfo.set(true);
    } else {
      this.showRefreshInfo.set(false);
    }
  }
}
