import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { Type } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { Checkbox } from "primeng/checkbox";
import { InputText } from "primeng/inputtext";
import { Button } from "primeng/button";
import {
  BuildAndTestProcessExecutorService,
  BusinessProcessDefinition,
} from "@mxevolve/domains/business-process/data-access";
import {
  BuildAndTestPrefilledInputsComponent,
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  UserStoryInputComponent,
} from "@mxevolve/domains/business-process/widget";
import { ScenarioDefinitionDropdownComponent } from "@mxevolve/domains/test/widget";
import {
  BranchInputComponent,
  RepositorySelectorComponent,
} from "@mxevolve/domains/scm/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { AnalyticsTrackerService } from "@mxflow/core/analytics-tracker";
import {
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
} from "@mxevolve/domains/business-process/ui";
import { BuildAndTestExecutorComponent } from "./build-and-test-executor.component";

function simulateCvaChange<T>(component: Type<unknown>, value: T): void {
  const instance = ngMocks.find(component).componentInstance as unknown as {
    __simulateChange?: (value: T) => void;
  };
  if (!instance.__simulateChange) {
    throw new Error("Mocked component is not a ControlValueAccessor");
  }
  instance.__simulateChange(value);
}

const COMPONENT_IMPORTS = [
  ReactiveFormsModule,
  Checkbox,
  InputText,
  Button,
  MockComponent(BuildAndTestPrefilledInputsComponent),
  MockComponent(InfraGroupSelectorComponent),
  MockComponent(NotificationsRecipientsInputComponent),
  MockComponent(UserStoryInputComponent),
  MockComponent(ScenarioDefinitionDropdownComponent),
  MockComponent(RepositorySelectorComponent),
  MockComponent(BranchInputComponent),
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
];

const mockExecutorService = {
  executeBuildAndTestProcessDefinition: jest.fn(),
};

const mockToastService = {
  showError: jest.fn(),
};

const mockAnalyticsTracker = { trackEvent: jest.fn() };

const SHARED_PROVIDERS = [
  { provide: AnalyticsTrackerService, useValue: mockAnalyticsTracker },
];

const FULLY_PREFILLED_INPUTS = [
  { inputId: "repositoryId", value: "repo-1" },
  { inputId: "configurationBranchName", value: "branch-1" },
  { inputId: "configurationParentBranch", value: "parent-1" },
  { inputId: "buildScenarioDefinitionId", value: "scenario-1" },
  { inputId: "buildEnvironmentInfraGroup", value: "env-group-1" },
  { inputId: "buildAndTestInfraGroup", value: "test-group-1" },
];

function definition(
  providedInputs: { inputId: string; value: unknown }[] = []
): BusinessProcessDefinition {
  return {
    id: "def-1",
    name: "Build - 000001",
    description: "Build and Test",
    sourceDefinitionId: "configuration-build-and-test",
    providedInputs,
    family: { id: "user-story-build-and-test", name: "Build & Test" },
  };
}

async function renderComponent(
  providedInputs: { inputId: string; value: unknown }[] = []
) {
  mockExecutorService.executeBuildAndTestProcessDefinition.mockReturnValue(
    of({ id: "exec-1" })
  );

  return render(BuildAndTestExecutorComponent, {
    inputs: { projectId: "project-1", definition: definition(providedInputs) },
    componentImports: COMPONENT_IMPORTS,
    componentProviders: [
      {
        provide: BuildAndTestProcessExecutorService,
        useValue: mockExecutorService,
      },
      ...SHARED_PROVIDERS,
    ],
    providers: [
      {
        provide: BuildAndTestProcessExecutorService,
        useValue: mockExecutorService,
      },
      { provide: ToastMessageService, useValue: mockToastService },
      ...SHARED_PROVIDERS,
    ],
  });
}

function scenarioDropdown(): Element | null {
  return document.querySelector("mxevolve-scenario-definition-dropdown");
}

/**
 * A field's own `<label>`. "Build Scenario" is both a group heading and a field
 * label - as it is in legacy - so the element type disambiguates them.
 */
function fieldLabel(text: string): HTMLElement {
  return screen.getByText(text, { selector: "label" });
}

function buildButton(): HTMLElement {
  return screen.getByRole("button", { name: "Build" });
}

describe("BuildAndTestExecutorComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("field presence", () => {
    it("hides the branch fields until a repository is selected (legacy repo-first gating)", async () => {
      await renderComponent();

      expect(screen.getByText("Repository")).toBeTruthy();
      expect(
        document.querySelector("mxevolve-repository-selector")
      ).toBeTruthy();
      expect(screen.queryByText("Configuration Branch Name")).toBeNull();
      expect(screen.queryByText("Configuration Parent Branch")).toBeNull();
      expect(document.querySelectorAll("mxevolve-branch-input")).toHaveLength(
        0
      );

      simulateCvaChange(RepositorySelectorComponent, "repo-1");

      await waitFor(() =>
        expect(screen.getByText("Configuration Branch Name")).toBeTruthy()
      );
      expect(screen.getByText("Configuration Parent Branch")).toBeTruthy();
      expect(document.querySelectorAll("mxevolve-branch-input")).toHaveLength(
        2
      );
    });

    it("shows every non-prefilled field with its section heading", async () => {
      await renderComponent();
      simulateCvaChange(RepositorySelectorComponent, "repo-1");

      await waitFor(() =>
        expect(screen.getByText("Configuration Branch Name")).toBeTruthy()
      );
      expect(screen.getByLabelText("Execution Name")).toBeTruthy();
      expect(screen.getByText("Configuration Parameters")).toBeTruthy();
      expect(screen.getByText("Repository")).toBeTruthy();
      expect(
        document.querySelector("mxevolve-repository-selector")
      ).toBeTruthy();
      expect(screen.getByText("Configuration Branch Name")).toBeTruthy();
      expect(screen.getByText("Configuration Parent Branch")).toBeTruthy();
      expect(document.querySelectorAll("mxevolve-branch-input")).toHaveLength(
        2
      );
      expect(fieldLabel("Build Scenario")).toBeTruthy();
      expect(screen.getByText("Build Environment")).toBeTruthy();
      expect(
        screen.getByRole("checkbox", {
          name: 'Skip "Prepare Build Environment" step',
        })
      ).toBeTruthy();
      expect(scenarioDropdown()).toBeTruthy();
      expect(screen.getByText("User Stories")).toBeTruthy();
      expect(ngMocks.find(UserStoryInputComponent).componentInstance).toBeTruthy();
      expect(screen.getByText("Infrastructure Parameters")).toBeTruthy();
      expect(ngMocks.findAll(InfraGroupSelectorComponent)).toHaveLength(
        2
      );
      expect(screen.getByText("Notifications")).toBeTruthy();
      expect(
        ngMocks.find(NotificationsRecipientsInputComponent).componentInstance
      ).toBeTruthy();
      expect(buildButton()).toBeTruthy();
    });

    it("hides prefilled fields from the form and shows them read-only on the details panel", async () => {
      const user = userEvent.setup();
      await renderComponent(FULLY_PREFILLED_INPUTS);

      expect(screen.queryByText("Repository")).toBeNull();
      expect(document.querySelector("mxevolve-repository-selector")).toBeNull();
      expect(document.querySelectorAll("mxevolve-branch-input")).toHaveLength(
        0
      );
      expect(ngMocks.findAll(InfraGroupSelectorComponent)).toHaveLength(
        0
      );

      await user.click(
        screen.getByRole("button", { name: "Build - 000001 Details" })
      );

      const prefilled = ngMocks.find(BuildAndTestPrefilledInputsComponent);
      expect(ngMocks.input(prefilled, "providedInputs")).toEqual(
        FULLY_PREFILLED_INPUTS
      );
    });
  });

  describe("required-field markers", () => {
    it("renders the mandatory-field legend", async () => {
      await renderComponent();

      expect(screen.getByText("* Mandatory Field")).toBeTruthy();
    });

    it("marks required fields with an asterisk and leaves optional fields unmarked", async () => {
      await renderComponent();
      simulateCvaChange(RepositorySelectorComponent, "repo-1");

      await waitFor(() =>
        expect(fieldLabel("Configuration Branch Name")).toBeTruthy()
      );

      for (const label of [
        "Execution Name",
        "Repository",
        "Configuration Branch Name",
        "Configuration Parent Branch",
        "Build Scenario",
        "Build Environment Infra Group",
        "Build and Test Infra Group",
      ]) {
        expect(fieldLabel(label).classList.contains("required")).toBe(true);
      }
      // The user-story group heading carries the marker, not a field label.
      expect(
        screen.getByText("User Stories").classList.contains("required")
      ).toBe(true);

      expect(
        screen
          .getByText("Expiry Date Notification Recipients")
          .classList.contains("required")
      ).toBe(false);
    });
  });

  describe("conditional visibility", () => {
    it("hides the build scenario field when skip build environment deployment is checked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      expect(scenarioDropdown()).toBeTruthy();

      await user.click(
        screen.getByRole("checkbox", {
          name: 'Skip "Prepare Build Environment" step',
        })
      );

      await waitFor(() => expect(scenarioDropdown()).toBeNull());
    });
  });

  describe("feature-flagged user-story validation", () => {
    it("wires the user-story input with validation enabled and the project id", async () => {
      await renderComponent();

      const userStory = ngMocks.find(UserStoryInputComponent);
      expect(ngMocks.input(userStory, "shouldValidate")).toBe(true);
      expect(ngMocks.input(userStory, "projectId")).toBe("project-1");
    });
  });

  describe("submit", () => {
    it("submits the exact legacy payload and emits created on success", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent(FULLY_PREFILLED_INPUTS);
      const created = jest.fn();
      fixture.componentInstance.created.subscribe(created);

      await user.type(screen.getByLabelText("Execution Name"), "My run");
      simulateCvaChange(UserStoryInputComponent, ["VAL-1"]);

      await user.click(buildButton());

      expect(
        mockExecutorService.executeBuildAndTestProcessDefinition
      ).toHaveBeenCalledWith("project-1", {
        definitionId: "def-1",
        name: "My run",
        repositoryId: "repo-1",
        configurationBranchName: "branch-1",
        configurationParentBranch: "parent-1",
        userStoryIds: ["VAL-1"],
        buildEnvironmentInfraGroup: "env-group-1",
        buildAndTestInfraGroup: "test-group-1",
        skipPrepareBuildEnvironment: false,
        buildEnvironmentScenarioDefinitionId: "scenario-1",
        notificationsRecipients: undefined,
      });
      expect(created).toHaveBeenCalledWith("exec-1");
    });

    it("keeps the build button disabled until the form is valid", async () => {
      const user = userEvent.setup();
      await renderComponent(FULLY_PREFILLED_INPUTS);

      expect(buildButton()).toBeDisabled();

      await user.type(screen.getByLabelText("Execution Name"), "My run");
      simulateCvaChange(UserStoryInputComponent, ["VAL-1"]);

      await waitFor(() => expect(buildButton()).toBeEnabled());
    });

    it("shows an error toast and does not emit created when the execute call fails", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent(FULLY_PREFILLED_INPUTS);
      const created = jest.fn();
      fixture.componentInstance.created.subscribe(created);
      mockExecutorService.executeBuildAndTestProcessDefinition.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      await user.type(screen.getByLabelText("Execution Name"), "My run");
      simulateCvaChange(UserStoryInputComponent, ["VAL-1"]);
      await user.click(buildButton());

      await waitFor(() =>
        expect(mockToastService.showError).toHaveBeenCalledWith("boom")
      );
      expect(created).not.toHaveBeenCalled();
    });
  });

  describe("repush prefill (initialValues)", () => {
    it("pre-fills an editable field from the seed and keeps it visible in the form", async () => {
      await render(BuildAndTestExecutorComponent, {
        inputs: {
          projectId: "project-1",
          definition: definition(),
          initialValues: { name: "Prefilled Run" },
        },
        componentImports: COMPONENT_IMPORTS,
        componentProviders: [
          {
            provide: BuildAndTestProcessExecutorService,
            useValue: mockExecutorService,
          },
          ...SHARED_PROVIDERS,
        ],
        providers: [
          { provide: ToastMessageService, useValue: mockToastService },
          ...SHARED_PROVIDERS,
        ],
      });

      expect(screen.getByLabelText("Execution Name")).toHaveValue(
        "Prefilled Run"
      );
    });
  });

  describe("field descriptions (legacy definition-input strings)", () => {
    it("describes the repository field", async () => {
      await renderComponent();

      expect(
        screen.getByText(
          "Select the Repository where the configuration is stored"
        )
      ).toBeTruthy();
    });

    it("describes the user story field", async () => {
      await renderComponent();

      expect(
        screen.getByText("Enter the IDs of the stories you will be working on")
      ).toBeTruthy();
    });

    it("describes the build environment infra group", async () => {
      await renderComponent();

      expect(
        screen.getByText("Select the Infra Group for the build environment")
      ).toBeTruthy();
    });

    it("describes the notification recipients", async () => {
      await renderComponent();

      expect(
        screen.getByText(
          "Select the users who will receive email notifications as the business process approaches its expiry date"
        )
      ).toBeTruthy();
    });
  });

  describe("skip build environment analytics", () => {
    it("tracks skipping the prepare-build-environment step", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByLabelText('Skip "Prepare Build Environment" step')
      );

      await waitFor(() =>
        expect(mockAnalyticsTracker.trackEvent).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          "CI Process - Prepare-Build Environment Skipped"
        )
      );
    });
  });
});
