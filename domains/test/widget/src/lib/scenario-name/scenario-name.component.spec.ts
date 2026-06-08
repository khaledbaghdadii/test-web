import { render, screen, waitFor } from "@testing-library/angular";
import { of, Subject, throwError } from "rxjs";
import { ScenarioNameComponent } from "./scenario-name.component";
import {
  ScenarioDefinitionService,
  TestDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";

function mockScenarioDefinitionService(
  overrides: Partial<ScenarioDefinitionService> = {}
): ScenarioDefinitionService {
  return {
    getScenarioDefinitionById: jest.fn().mockReturnValue(
      of({
        id: "scenario-1",
        projectId: "project-1",
        name: "My Scenario",
        archived: false,
        tests: [],
        idempotent: false,
        nonFunctionalTest: false,
        bpcs: [],
        environmentDefinitionId: "env-1",
        heaviness: "LIGHT",
      })
    ),
    ...overrides,
  } as unknown as ScenarioDefinitionService;
}

function mockToastMessageService(): ToastMessageService {
  return { showError: jest.fn() } as unknown as ToastMessageService;
}

const REQUIRED_INPUTS = {
  projectId: "project-1",
  scenarioDefinitionId: "scenario-1",
};

async function renderComponent(
  inputs: Partial<{ projectId: string; scenarioDefinitionId: string }> = {},
  service = mockScenarioDefinitionService(),
  toast = mockToastMessageService()
) {
  return render(ScenarioNameComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: ScenarioDefinitionService, useValue: service },
      { provide: TestDefinitionService, useValue: {} },
      { provide: ToastMessageService, useValue: toast },
    ],
  });
}

describe("ScenarioNameComponent", () => {
  it("shows a skeleton while loading", async () => {
    const subject = new Subject();
    const service = mockScenarioDefinitionService({
      getScenarioDefinitionById: jest.fn().mockReturnValue(subject),
    });

    await renderComponent({}, service);

    expect(document.querySelector("p-skeleton")).toBeTruthy();
  });

  it("hides the skeleton after loading", async () => {
    await renderComponent();

    await screen.findByText("My Scenario");
    expect(document.querySelector("p-skeleton")).toBeNull();
  });

  it("shows a dash when the service fails", async () => {
    const service = mockScenarioDefinitionService({
      getScenarioDefinitionById: jest
        .fn()
        .mockReturnValue(throwError(() => new Error("Network error"))),
    });

    await renderComponent({}, service);

    expect(await screen.findByText("-")).toBeTruthy();
  });

  it("shows a toast error when the service fails", async () => {
    const service = mockScenarioDefinitionService({
      getScenarioDefinitionById: jest
        .fn()
        .mockReturnValue(throwError(() => new Error("Network error"))),
    });
    const toast = mockToastMessageService();

    await renderComponent({}, service, toast);

    await waitFor(() => {
      expect(toast.showError).toHaveBeenCalledWith(
        "Failed to load scenario name"
      );
    });
  });
});
