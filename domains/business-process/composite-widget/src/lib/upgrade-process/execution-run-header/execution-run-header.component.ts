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
  ExecutionFamily,
  StageStatus,
  type UpgradeProcessExecution,
} from "@mxevolve/domains/business-process/util";
import { ActivityRunDetailsComponent } from "@mxevolve/domains/business-process/widget";
import { ExecutionAbortButtonComponent } from "../../execution-abort-button/execution-abort-button.component";
import { BranchDetailsComponent } from "../../branch-details/branch-details.component";
import { ReferenceEnvironmentsComponent } from "../reference-environments/reference-environments.component";
import { UpgradeProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import {
  CommitsService,
  DevelopmentService,
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
  selector: "mxevolve-execution-run-header",
  imports: [
    Divider,
    Card,
    TooltipModule,
    ExecutionStatusTagComponent,
    ExpiryChipComponent,
    ActivityRunDetailsComponent,
    ExecutionAbortButtonComponent,
    BranchDetailsComponent,
    ReferenceEnvironmentsComponent,
    MxevolveIconComponent,
  ],
  providers: [
    UpgradeProcessStateUpdaterService,
    DevelopmentService,
    CommitsService,
    ToastMessageService,
  ],
  templateUrl: "./execution-run-header.component.html",
})
export class ExecutionRunHeaderComponent {
  readonly execution = input.required<UpgradeProcessExecution>();

  readonly familyId = ExecutionFamily.UPGRADE_PROCESS;

  private readonly stateUpdater = inject(UpgradeProcessStateUpdaterService);
  private readonly developmentService = inject(DevelopmentService);
  private readonly commitsService = inject(CommitsService);
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
    params: () => {
      const dev = this.development();
      if (!dev || dev.deleted || !dev.source || !dev.repository?.id)
        return undefined;
      return {
        projectId: this.execution().projectId,
        repositoryId: dev.repository.id,
        sourceBranch: dev.source,
        destinationBranch: dev.name,
      };
    },
    stream: ({ params }) => this.commitsService.getCommitDifferences(params),
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
    if (this.execution().referenceEnvironmentDeployment.supported) {
      tabs.push({
        label: "Reference Environment",
        value: "reference-environment",
      });
    }

    if (this.branchCreationDetails()) {
      tabs.push({
        label: "Branch Details",
        value: "branch-details",
      });
    }

    tabs.push({
      label: "Activity Run Details",
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
