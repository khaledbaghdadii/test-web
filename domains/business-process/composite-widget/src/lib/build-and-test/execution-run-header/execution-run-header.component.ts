import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";

import { Divider } from "primeng/divider";
import { Card } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import {
  ExecutionStatusTagComponent,
  ExpiryChipComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  type BuildAndTestProcessExecution,
  ExecutionFamily,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import { BuildAndTestActivityRunDetailsComponent } from "@mxevolve/domains/business-process/widget";
import { BreadcrumbComponent } from "@mxevolve/domains/analytics/widget";
import { ExecutionAbortButtonComponent } from "../../execution-abort-button/execution-abort-button.component";
import { BranchDetailsComponent } from "../../branch-details/branch-details.component";
import { BuildAndTestProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import { BranchDetailsFacadeService } from "@mxevolve/domains/scm/composite-widget";
import {
  CommitsService,
  DevelopmentService,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";

interface TabOption {
  label: string;
  value: string;
}

@Component({
  selector: "mxevolve-build-and-test-run-header",
  imports: [
    Divider,
    Card,
    TooltipModule,
    ExecutionStatusTagComponent,
    ExpiryChipComponent,
    BuildAndTestActivityRunDetailsComponent,
    ExecutionAbortButtonComponent,
    BranchDetailsComponent,
    MxevolveIconComponent,
    BreadcrumbComponent,
  ],
  providers: [
    BuildAndTestProcessStateUpdaterService,
    DevelopmentService,
    BranchDetailsFacadeService,
    CommitsService,
    MergeRequestService,
    ToastMessageService,
  ],
  templateUrl: "./execution-run-header.component.html",
})
export class ExecutionRunHeaderComponent {
  readonly execution = input.required<BuildAndTestProcessExecution>();

  readonly familyId = ExecutionFamily.USER_STORY_BUILD_AND_TEST;

  private readonly stateUpdater = inject(
    BuildAndTestProcessStateUpdaterService
  );
  private readonly developmentService = inject(DevelopmentService);
  private readonly branchDetailsFacade = inject(BranchDetailsFacadeService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly branchCreationDetails = computed(() => {
    if (this.execution().createBranchStage.status === StageStatus.FAILED) {
      return {
        failed: true,
        failureReason: this.execution().createBranchStage.errorMessage,
      };
    } else if (
      this.execution().createBranchStage.status === StageStatus.PASSED
    ) {
      return {
        developmentId: this.execution().createBranchStage.developmentId,
        failed: false,
      };
    } else {
      return undefined;
    }
  });

  private readonly developmentResource = rxResource({
    params: () => {
      const developmentId = this.branchCreationDetails()?.developmentId;
      if (!developmentId || this.branchCreationDetails()?.failed)
        return undefined;
      return { projectId: this.execution().projectId, developmentId };
    },
    stream: ({ params }) =>
      this.developmentService.getDevelopment(
        params.projectId,
        params.developmentId,
        true
      ),
  });

  readonly development = computed(() =>
    this.developmentResource.hasValue()
      ? this.developmentResource.value()
      : undefined
  );

  private readonly commitsBehindResource = rxResource({
    params: () =>
      this.branchDetailsFacade.commitsBehindParams(
        this.development(),
        this.execution().projectId
      ),
    stream: ({ params }) => this.branchDetailsFacade.getCommitsBehind(params),
  });

  readonly commitsBehindCount = computed(() =>
    this.commitsBehindResource.hasValue()
      ? this.commitsBehindResource.value().length
      : 0
  );

  readonly commitsBehindTooltip = computed(() => {
    const count = this.commitsBehindCount();
    const dev = this.development();
    if (!dev || count === 0) return "";
    const commitText = count === 1 ? "commit" : "commits";
    return `${count} ${commitText} behind ${dev.source ?? "parent"}`;
  });

  constructor() {
    effect(() => {
      if (this.commitsBehindResource.error()) {
        this.toastMessageService.showError(
          "Failed to fetch commits behind count."
        );
      }
    });
  }

  readonly selectedTab = linkedSignal<string>(() =>
    this.branchCreationDetails()?.failed ? "branch-details" : ""
  );

  readonly tabOptions = computed<TabOption[]>(() => {
    const tabs: TabOption[] = [];

    if (this.branchCreationDetails()) {
      tabs.push({
        label: "Branch Details",
        value: "branch-details",
      });
    }

    tabs.push({
      label: "Run Details",
      value: "activity-run-details",
    });
    return tabs;
  });

  selectTab(tab: TabOption): void {
    this.selectedTab.set(this.selectedTab() === tab.value ? "" : tab.value);
  }

  reloadProcess(): void {
    this.stateUpdater.reloadProcessDetails(
      this.execution().id,
      this.execution().projectId
    );
  }
}
