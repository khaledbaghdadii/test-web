import { render, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { BuildEnvironmentScenarioActionsComponent } from "./build-environment-scenario-actions.component";
import {
  RerunScenarioButtonComponent,
  SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE,
  ScenarioDetailsLinkButtonComponent,
  ScenarioRunsPanelFacadeService,
} from "@mxevolve/domains/test/widget";

function buildHead(
  overrides: Partial<{
    id: string;
    status: ScenarioRunStatus;
    factoryProductId: string;
    executionGroupId: string;
    repushable: boolean;
    warningMessage: string;
  }> = {}
) {
  return {
    id: "run-001",
    name: "Build scenario",
    status: ScenarioRunStatus.PASSED,
    factoryProductId: "fp-001",
    executionGroupId: "eg-001",
    repushable: true,
    ...overrides,
  };
}

function createFacadeMock(head: ReturnType<typeof buildHead> | undefined) {
  return {
    fetch: jest.fn(() => of(head ? [{ head }] : [])),
  } as unknown as ScenarioRunsPanelFacadeService;
}

async function renderComponent(
  options: {
    head?: ReturnType<typeof buildHead>;
    scenarioDetailsDisabled?: boolean;
    warningMessageMap?: Record<string, string>;
  } = {}
) {
  const facade = createFacadeMock(
    "head" in options ? options.head : buildHead()
  );

  const renderResult = await render(BuildEnvironmentScenarioActionsComponent, {
    imports: [
      MockComponent(MxevolveIconComponent),
      MockComponent(RerunScenarioButtonComponent),
      MockComponent(ScenarioDetailsLinkButtonComponent),
    ],
    componentProviders: [
      { provide: ScenarioRunsPanelFacadeService, useValue: facade },
    ],
    inputs: {
      projectId: "proj-001",
      processId: "proc-001",
      scenarioDetailsDisabled: options.scenarioDetailsDisabled ?? false,
      ...(options.warningMessageMap === undefined
        ? {}
        : { warningMessageMap: options.warningMessageMap }),
    },
  });

  return { ...renderResult, facade };
}

describe("BuildEnvironmentScenarioActionsComponent", () => {
  it("fetches scenario runs for the build environment sub-context", async () => {
    const { facade } = await renderComponent();

    await waitFor(() => expect(facade.fetch).toHaveBeenCalled());

    expect(facade.fetch).toHaveBeenCalledWith({
      projectId: "proj-001",
      contextId: "proc-001",
      subContextId: "PREPARE_BUILD_ENVIRONMENT",
    });
  });

  it("shows the failure indicator when the scenario failed", async () => {
    await renderComponent({
      head: buildHead({ status: ScenarioRunStatus.FAILED }),
    });

    await waitFor(() =>
      expect(
        document.querySelector('[data-testid="scenario-failed-indicator"]')
      ).toBeTruthy()
    );

    const indicator = document.querySelector(
      '[data-testid="scenario-failed-indicator"]'
    );
    expect(indicator?.tagName.toLowerCase()).toBe("mxevolve-icon");
  });

  it("does not show the failure indicator when the scenario did not fail", async () => {
    await renderComponent({
      head: buildHead({ status: ScenarioRunStatus.PASSED }),
    });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-rerun-scenario-button")
      ).toBeTruthy()
    );

    expect(
      document.querySelector('[data-testid="scenario-failed-indicator"]')
    ).toBeNull();
  });

  it("passes the scenario run details to the repush button", async () => {
    const { fixture } = await renderComponent({
      head: buildHead({
        id: "run-777",
        factoryProductId: "fp-777",
        executionGroupId: "eg-777",
        repushable: false,
        warningMessage: "Careful, this will reset the environment.",
      }),
    });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-rerun-scenario-button")
      ).toBeTruthy()
    );

    const button = ngMocks.find(fixture, RerunScenarioButtonComponent);
    expect(button.componentInstance.projectId).toBe("proj-001");
    expect(button.componentInstance.scenarioRunId).toBe("run-777");
    expect(button.componentInstance.factoryProductId).toBe("fp-777");
    expect(button.componentInstance.executionGroupId).toBe("eg-777");
    expect(button.componentInstance.repushable).toBe(false);
    expect(button.componentInstance.warningMessage).toBe(
      "Careful, this will reset the environment."
    );
  });

  it("defaults the repush button's warningMessageMap to the shared execution-group permission warning map", async () => {
    const { fixture } = await renderComponent({ head: buildHead() });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-rerun-scenario-button")
      ).toBeTruthy()
    );

    const button = ngMocks.find(fixture, RerunScenarioButtonComponent);
    expect(button.componentInstance.warningMessageMap).toBe(
      SCENARIO_EXECUTION_GROUP_PERMISSION_WARNING_MESSAGE
    );
  });

  it("allows overriding the repush button's warningMessageMap", async () => {
    const customMap = { CUSTOM_CODE: "Custom warning text" };
    const { fixture } = await renderComponent({
      head: buildHead(),
      warningMessageMap: customMap,
    });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-rerun-scenario-button")
      ).toBeTruthy()
    );

    const button = ngMocks.find(fixture, RerunScenarioButtonComponent);
    expect(button.componentInstance.warningMessageMap).toBe(customMap);
  });

  it("re-emits the scenario rerun event from the repush button", async () => {
    const rerunSpy = jest.fn();
    const facade = createFacadeMock(buildHead());

    const { fixture } = await render(BuildEnvironmentScenarioActionsComponent, {
      imports: [
        MockComponent(MxevolveIconComponent),
        MockComponent(RerunScenarioButtonComponent),
        MockComponent(ScenarioDetailsLinkButtonComponent),
      ],
      componentProviders: [
        { provide: ScenarioRunsPanelFacadeService, useValue: facade },
      ],
      inputs: { projectId: "proj-001", processId: "proc-001" },
      on: { scenarioRerun: rerunSpy },
    });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-rerun-scenario-button")
      ).toBeTruthy()
    );

    const button = ngMocks.find(fixture, RerunScenarioButtonComponent);
    button.componentInstance.scenarioRerun.emit();
    expect(rerunSpy).toHaveBeenCalledTimes(1);
  });

  it("renders the scenario details link button for the latest run", async () => {
    const { fixture } = await renderComponent({
      head: buildHead({ id: "run-555" }),
    });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-scenario-details-link-button")
      ).toBeTruthy()
    );

    const link = ngMocks.find(fixture, ScenarioDetailsLinkButtonComponent);
    expect(link.componentInstance.projectId).toBe("proj-001");
    expect(link.componentInstance.scenarioRunId).toBe("run-555");
    expect(link.componentInstance.disabled).toBe(false);
  });

  it("disables the scenario details link button when scenario details are disabled", async () => {
    const { fixture } = await renderComponent({
      head: buildHead({ id: "run-555" }),
      scenarioDetailsDisabled: true,
    });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-scenario-details-link-button")
      ).toBeTruthy()
    );

    const link = ngMocks.find(fixture, ScenarioDetailsLinkButtonComponent);
    expect(link.componentInstance.disabled).toBe(true);
  });

  it("renders nothing when there is no scenario run", async () => {
    await renderComponent({ head: undefined });

    await waitFor(() => expect(true).toBe(true));

    expect(document.querySelector("mxevolve-rerun-scenario-button")).toBeNull();
    expect(
      document.querySelector("mxevolve-scenario-details-link-button")
    ).toBeNull();
  });

  it("does not enable the keep-services option on the repush button", async () => {
    const { fixture } = await renderComponent({ head: buildHead() });

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-rerun-scenario-button")
      ).toBeTruthy()
    );

    const button = ngMocks.find(fixture, RerunScenarioButtonComponent);
    expect(button.componentInstance.enableKeepServices).toBeFalsy();
  });
});
