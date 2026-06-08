import { render, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { RunScenarioDropdownComponent } from "@mxflow/test-management";
import { BuildAndTestRunTpkComponent } from "./build-and-test-run-tpk.component";
import { SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE } from "../scenario-execution-group-permission-warning-message";

async function renderComponent(
  inputs: {
    branchName?: string;
    executionGroupId?: string;
    machineGroupId?: string;
  } = {}
) {
  return render(BuildAndTestRunTpkComponent, {
    imports: [MockComponent(RunScenarioDropdownComponent)],
    inputs: {
      branchName: "feature/temp-branch",
      executionGroupId: "scenario-group-001",
      ...inputs,
    },
  });
}

describe("BuildAndTestRunTpkComponent", () => {
  it("renders the legacy run scenario dropdown with Build & Test inputs", async () => {
    const { fixture } = await renderComponent({
      machineGroupId: "infra-group-001",
    });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-run-scenario-dropdown")
      ).toBeTruthy()
    );

    const dropdown = ngMocks.find(fixture, RunScenarioDropdownComponent);
    expect(dropdown.componentInstance.subContextId).toBe("BUILD_AND_TEST");
    expect(dropdown.componentInstance.branchName).toBe("feature/temp-branch");
    expect(dropdown.componentInstance.executionGroupId).toBe(
      "scenario-group-001"
    );
    expect(dropdown.componentInstance.machineGroupId).toBe("infra-group-001");
    expect(dropdown.componentInstance.warningMessageMap).toEqual(
      SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE
    );
  });

  it("preserves the legacy Build & Test run flags", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-run-scenario-dropdown")
      ).toBeTruthy()
    );

    const dropdown = ngMocks.find(fixture, RunScenarioDropdownComponent);
    expect(dropdown.componentInstance.enableKeepServices).toBe(true);
    expect(dropdown.componentInstance.keepServices).toBe(false);
    expect(dropdown.componentInstance.disableConfigurationEditor).toBe(false);
    expect(dropdown.componentInstance.validationScopeEnabled).toBe(false);
    expect(dropdown.componentInstance.incidentEnabled).toBe(false);
  });

  it("uses the migrated TPK labels while leaving the backend scenario request intact", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-run-scenario-dropdown")
      ).toBeTruthy()
    );

    const dropdown = ngMocks.find(fixture, RunScenarioDropdownComponent);
    expect(dropdown.componentInstance.definitionLabel).toBe(
      "Select a TPK that you wish to launch to validate your change"
    );
    expect(dropdown.componentInstance.selectorPlaceholder).toBe("Select TPK");
    expect(dropdown.componentInstance.runButtonLabel).toBe("Run TPK");
    expect(dropdown.componentInstance.dialogHeader).toBe("Run TPK");
  });

  it("emits scenarioPushed when the legacy dropdown emits scenarioPushed", async () => {
    const { fixture } = await renderComponent();
    const pushedSpy = jest.fn();
    fixture.componentInstance.scenarioPushed.subscribe(pushedSpy);

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-run-scenario-dropdown")
      ).toBeTruthy()
    );

    ngMocks
      .find(fixture, RunScenarioDropdownComponent)
      .componentInstance.scenarioPushed.emit();

    expect(pushedSpy).toHaveBeenCalled();
  });

  it("emits errorOccurred when the legacy dropdown emits an error", async () => {
    const { fixture } = await renderComponent();
    const errorSpy = jest.fn();
    fixture.componentInstance.errorOccurred.subscribe(errorSpy);

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-run-scenario-dropdown")
      ).toBeTruthy()
    );

    ngMocks
      .find(fixture, RunScenarioDropdownComponent)
      .componentInstance.errorEventEmitter.emit("failed");

    expect(errorSpy).toHaveBeenCalledWith("failed");
  });
});
