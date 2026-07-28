import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from "@angular/core";

import { Divider } from "primeng/divider";
import { Card } from "primeng/card";
import {
  ExecutionStatusTagComponent,
  ExpiryChipComponent,
} from "@mxevolve/domains/business-process/ui";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import { ValidationProcessActivityRunDetailsComponent } from "@mxevolve/domains/business-process/widget";
import { BreadcrumbComponent } from "@mxevolve/domains/analytics/widget";
import {
  ValidationProcessExecution,
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionAbortButtonComponent } from "../../execution-abort-button/execution-abort-button.component";
import { ValidationProcessBranchDetailsComponent } from "../branch-details/branch-details.component";

interface TabOption {
  label: string;
  value: string;
}

@Component({
  selector: "mxevolve-validation-process-execution-run-header",
  standalone: true,
  host: { style: "display: contents;" },
  imports: [
    Divider,
    Card,
    ExecutionStatusTagComponent,
    ExpiryChipComponent,
    ValidationProcessActivityRunDetailsComponent,
    ExecutionAbortButtonComponent,
    ValidationProcessBranchDetailsComponent,
    BreadcrumbComponent,
  ],
  templateUrl: "./execution-run-header.component.html",
})
export class ValidationProcessExecutionRunHeaderComponent {
  readonly execution = input.required<ValidationProcessExecution>();

  readonly familyId = ExecutionFamily.VALIDATION_PROCESS;

  private readonly stateUpdater = inject(ValidationProcessStateUpdaterService);

  readonly branchCreationDetails = computed(() => {
    const stage = this.execution().createBranchStage;
    if (stage.status === ValidationProcessStageStatus.FAILED) {
      return {
        failed: true,
        failureReason: stage.errorMessage,
      };
    } else if (stage.status === ValidationProcessStageStatus.PASSED) {
      return {
        developmentId: stage.developmentId,
        failed: false,
      };
    } else {
      return undefined;
    }
  });

  // Default to branch-details only when branch creation failed (to surface the failure);
  // otherwise no tab is open by default (details are not auto-expanded).
  readonly selectedTab = linkedSignal<string>(() =>
    this.branchCreationDetails()?.failed ? "branch-details" : ""
  );

  // D4 extension point: Reference Environment tab is omitted now but tabOptions
  // is structured so adding it is trivial — insert a push() before branch-details.
  readonly tabOptions = computed<TabOption[]>(() => {
    const tabs: TabOption[] = [];

    // D4 — future Reference Environment tab: when supported, push here:
    // tabs.push({ label: "Reference Environment", value: "reference-environment" });

    if (this.branchCreationDetails()) {
      tabs.push({ label: "Branch Details", value: "branch-details" });
    }

    tabs.push({ label: "Run Details", value: "activity-run-details" });

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
