import { Component, computed, inject, input } from "@angular/core";
import { BuildAndTestProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import { BusinessProcessContentContainerComponent } from "@mxevolve/domains/business-process/ui";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import {
  ConfigAuditButtonComponent,
  EnvironmentStatusPanelComponent,
} from "@mxevolve/domains/environment/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE } from "../scenario-execution-group-permission-warning-message";
import { BuildAndTestRunTpkComponent } from "./build-and-test-run-tpk.component";

const BUILD_AND_TEST_SUB_CONTEXT_ID = "BUILD_AND_TEST";

/**
 * Test panel of the Build & Test step.
 *
 * Mirrors upgrade-process convert-binary-stage: wraps the shared
 * `mxevolve-scenario-runs` widget (TPK Results) and restores the legacy
 * Select/Run TPK action row.
 *
 * When an environment id is available, the shared environment status bar is
 * shown with the Config Audit split-button projected into its [extraActions]
 * slot (Story A's slot).
 *
 * NOTE: `environmentId` is optional because the VAL-26634
 * `BuildAndTestProcessExecution` model does not yet expose the test environment
 * id (legacy resolves it indirectly from a scenario execution). The env bar +
 * Config Audit render only once that id is threaded through the data-access lib.
 */
@Component({
  selector: "mxevolve-build-and-test-test-section",
  templateUrl: "./build-and-test-test-section.component.html",
  imports: [
    BusinessProcessContentContainerComponent,
    ScenarioRunsComponent,
    ConfigAuditButtonComponent,
    EnvironmentStatusPanelComponent,
    BuildAndTestRunTpkComponent,
  ],
  providers: [BuildAndTestProcessStateUpdaterService, ToastMessageService],
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestTestSectionComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  /** Optional until the test environment id is threaded through the model. */
  readonly environmentId = input<string>();
  readonly branchName = input<string>();
  readonly executionGroupId = input<string>();
  readonly machineGroupId = input<string>();

  private readonly stateUpdater = inject(BuildAndTestProcessStateUpdaterService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly subContextId = BUILD_AND_TEST_SUB_CONTEXT_ID;
  readonly warningMessageMap =
    SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE;
  readonly canRunTpk = computed(
    () => !!this.branchName() && !!this.executionGroupId()
  );

  reloadExecution(): void {
    this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId());
  }

  handleRunTpkError(errorMessage: string): void {
    this.toastMessageService.showError(errorMessage);
  }
}
