import { Component, input, output } from "@angular/core";
import { RunScenarioDropdownComponent } from "@mxflow/test-management";
import { SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE } from "../scenario-execution-group-permission-warning-message";

const BUILD_AND_TEST_SUB_CONTEXT_ID = "BUILD_AND_TEST";

/**
 * Build & Test specific wrapper around the legacy scenario launcher.
 * The request contract is still scenario-definition based, while the migrated
 * CI UI labels this as TPK selection.
 */
@Component({
  selector: "mxevolve-build-and-test-run-tpk",
  imports: [RunScenarioDropdownComponent],
  template: `
    <mxevolve-run-scenario-dropdown
      [subContextId]="subContextId"
      [branchName]="branchName()"
      [executionGroupId]="executionGroupId()"
      [warningMessageMap]="warningMessageMap"
      [machineGroupId]="machineGroupId()"
      [enableKeepServices]="true"
      [keepServices]="false"
      [disableConfigurationEditor]="false"
      [validationScopeEnabled]="false"
      [incidentEnabled]="false"
      definitionLabel="Select a TPK that you wish to launch to validate your change"
      selectorPlaceholder="Select TPK"
      runButtonLabel="Run TPK"
      dialogHeader="Run TPK"
      (scenarioPushed)="scenarioPushed.emit()"
      (errorEventEmitter)="errorOccurred.emit($event)"
    />
  `,
})
export class BuildAndTestRunTpkComponent {
  readonly branchName = input.required<string>();
  readonly executionGroupId = input.required<string>();
  readonly machineGroupId = input<string>();

  readonly scenarioPushed = output<void>();
  readonly errorOccurred = output<string>();

  readonly subContextId = BUILD_AND_TEST_SUB_CONTEXT_ID;
  readonly warningMessageMap =
    SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE;
}
