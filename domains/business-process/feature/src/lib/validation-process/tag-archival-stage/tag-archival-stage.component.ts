import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  ValidationProcessExecution,
  ValidationProcessStageStatus,
  ValidationProcessTagArchivalStage,
} from "@mxevolve/domains/business-process/data-access";
import { ValidationProcessArchivalUserStoriesComponent } from "@mxevolve/domains/business-process/widget";
import { ValidationProceedToNextStepComponent } from "@mxevolve/domains/business-process/composite-widget";
import { FinalProductDetailsComponent } from "@mxevolve/domains/artifact/widget";
import {
  CommitIdDisplayComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { Message } from "primeng/message";
import { Divider } from "primeng/divider";

const JIRA_USER_STORY_ARCHIVAL_FLAG = "jira-user-story-archival";

@Component({
  selector: "mxevolve-validation-process-tag-archival-stage",
  templateUrl: "./tag-archival-stage.component.html",
  host: {
    style: "display: contents;",
  },
  imports: [
    StageContainerComponent,
    BusinessProcessContentContainerComponent,
    ValidationProcessArchivalUserStoriesComponent,
    ValidationProceedToNextStepComponent,
    FinalProductDetailsComponent,
    CommitIdDisplayComponent,
    Message,
    Divider,
  ],
})
export class ValidationProcessTagArchivalStageComponent implements OnInit {
  /** Full execution needed for officiality + input (BC 2.1, 2.3) */
  readonly execution = input.required<ValidationProcessExecution>();

  private readonly featureFlagResolver = inject(FeatureFlagResolver);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly stage = computed<ValidationProcessTagArchivalStage>(
    () => this.execution().tagArchivalBranchStage
  );

  // BC 3.1: default hidden; set by flag resolution
  readonly jiraUserStoryArchivalEnabled = signal(false);

  ngOnInit(): void {
    this.featureFlagResolver
      .isFeatureEnabled(
        this.execution().projectId,
        JIRA_USER_STORY_ARCHIVAL_FLAG
      )
      .then((enabled) => this.jiraUserStoryArchivalEnabled.set(enabled));
  }

  // BC 2.3: jiraUserStoryArchivalEnabled && input.businessProcessQualityLevel === "MQG" && officiality === OFFICIAL
  readonly shouldShowUserStoriesArchival = computed(
    () =>
      this.jiraUserStoryArchivalEnabled() &&
      this.execution().input.businessProcessQualityLevel === "MQG" &&
      this.execution().officiality === "OFFICIAL"
  );

  // BC 2.2: Promoted Final Product section gated on the input final product (legacy: masterValidationInput.finalProductId)
  readonly shouldShowPromotedFinalProduct = computed(
    () => !!this.execution().input.finalProductId
  );

  // BC 2.4: tagArchivalBranchStage.status === RUNNING && !archivalUserStoriesUpdateStatus?.startDate
  readonly shouldShowTagIsInProgressBanner = computed(
    () =>
      this.stage().status === ValidationProcessStageStatus.RUNNING &&
      !this.stage().archivalUserStoriesUpdateStatus?.startDate
  );

  // BC 2.5: status === PENDING_INPUT || !!archivalUserStoriesUpdateStatus?.startDate
  readonly shouldShowProceedButton = computed(
    () =>
      this.stage().status === ValidationProcessStageStatus.PENDING_INPUT ||
      !!this.stage().archivalUserStoriesUpdateStatus?.startDate
  );

  failedToFetchFinalProduct(errorMessage: string): void {
    this.toastMessageService.showError(errorMessage);
  }
}
