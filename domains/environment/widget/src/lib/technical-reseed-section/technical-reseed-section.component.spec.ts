import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent } from "ng-mocks";
import { of, Subject, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  EnvironmentDefinition,
  EnvironmentDefinitionService,
  EnvironmentDefinitionStatus,
  TechnicalReseedExecutionGroupStatus,
  TechnicalReseedService,
  TechnicalReseedStatus,
} from "@mxevolve/domains/environment/data-access";
import {
  FinalProduct,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import { FinalProductDropdownInputComponent } from "@mxevolve/domains/artifact/widget";
import {
  CommitIdDisplayComponent,
  DateDisplayComponent,
  MxevolveIconComponent,
  MxevolveIllustrationComponent,
} from "@mxevolve/shared/ui/primitive";
import { TechnicalReseedSectionComponent } from "./technical-reseed-section.component";
import { EnvironmentDefinitionDropdownComponent } from "../environment-definition-dropdown/environment-definition-dropdown.component";

const ENVIRONMENT_DEFINITION: EnvironmentDefinition = {
  id: "env-def-001",
  name: "Small",
  status: EnvironmentDefinitionStatus.ACTIVE,
};

const FINAL_PRODUCT: FinalProduct = {
  id: "final-product-001",
  projectId: "project-001",
  branch: "release/branch",
  repositoryId: "repo-001",
  tag: "FP-1",
  clientConfigurations: [],
  environmentDefinitionId: "env-def-001",
  version: "1",
  configurationCommitId: "commit-001",
  state: FinalProductState.AVAILABLE,
  mxBundles: [],
  isTools: [],
  createdOn: "2026-06-01T10:00:00Z",
  syncRequests: [],
  validationLevel: "MQG",
};

const mockTechnicalReseedService = {
  getExecutionGroupDetails: jest.fn(),
  launchTechnicalReseed: jest.fn(),
  resumeTechnicalReseed: jest.fn(),
};

const mockEnvironmentDefinitionService = {
  getEnvironmentDefinitions: jest.fn(),
};

const mockToastMessageService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

function mockExecutionGroup(launchesAllowed = true) {
  return {
    executionGroupId: "reseed-group-001",
    status: TechnicalReseedExecutionGroupStatus.ENABLED,
    launchesAllowed,
    reason: launchesAllowed ? undefined : "Launches disabled",
    technicalReseedOperations: [
      {
        id: "operation-older",
        status: TechnicalReseedStatus.PASSED,
        branch: "release/branch",
        sourceCommit: "commit-older",
        validationLevel: "MQG",
        maintenanceLevel: "Full",
        environmentDefinitionId: "env-def-001",
        dumpIds: ["dump-1", "dump-2"],
        environmentId: "env-001",
        createdOn: "2026-06-01T10:00:00Z",
      },
      {
        id: "operation-newer",
        status: TechnicalReseedStatus.FAILED,
        branch: "release/branch",
        sourceCommit: "commit-newer",
        validationLevel: "DQG",
        maintenanceLevel: "Custom",
        environmentDefinitionId: "env-def-001",
        dumpIds: ["dump-3"],
        createdOn: "2026-06-02T10:00:00Z",
        resultMessage: "failed because of a backend error",
      },
    ],
  };
}

async function renderComponent(launchesAllowed = true) {
  mockTechnicalReseedService.getExecutionGroupDetails.mockReturnValue(
    of(mockExecutionGroup(launchesAllowed))
  );
  mockEnvironmentDefinitionService.getEnvironmentDefinitions.mockReturnValue(
    of([ENVIRONMENT_DEFINITION])
  );
  mockTechnicalReseedService.launchTechnicalReseed.mockReturnValue(
    of({ requestId: "request-001" })
  );
  mockTechnicalReseedService.resumeTechnicalReseed.mockReturnValue(of(null));

  return render(TechnicalReseedSectionComponent, {
    imports: [
      MockComponent(CommitIdDisplayComponent),
      MockComponent(DateDisplayComponent),
      MockComponent(MxevolveIconComponent),
      MockComponent(MxevolveIllustrationComponent),
      MockComponent(EnvironmentDefinitionDropdownComponent),
      MockComponent(FinalProductDropdownInputComponent),
    ],
    inputs: {
      projectId: "project-001",
      executionGroupId: "reseed-group-001",
      infraGroup: "infra-group-001",
      targetBranch: "feature/temp-branch",
    },
    providers: [],
    componentProviders: [
      { provide: TechnicalReseedService, useValue: mockTechnicalReseedService },
      {
        provide: EnvironmentDefinitionService,
        useValue: mockEnvironmentDefinitionService,
      },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("TechnicalReseedSectionComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads technical reseed execution group details for the execution group", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(
        mockTechnicalReseedService.getExecutionGroupDetails
      ).toHaveBeenCalledWith("project-001", "reseed-group-001")
    );
  });

  it("sorts operations by created date descending and numbers them newest first", async () => {
    await renderComponent();

    await screen.findByText("Technical Reseed 2");
    const newer = screen.getByText("Technical Reseed 2");
    const older = screen.getByText("Technical Reseed 1");

    expect(newer.compareDocumentPosition(older)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("keeps operation details collapsed by default", async () => {
    await renderComponent();

    await screen.findByText("Technical Reseed 2");

    expect(screen.queryByText("Commit ID")).toBeNull();
  });

  it("expands operation details when the operation row is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await screen.findByText("Technical Reseed 2");
    await user.click(
      screen.getByRole("button", { name: "Toggle Technical Reseed 2" })
    );

    expect(screen.getByText("Commit ID")).toBeTruthy();
    expect(screen.getByText("Small")).toBeTruthy();
  });

  it("shows a message info action only for operations with a status message", async () => {
    await renderComponent();

    await screen.findByText("Technical Reseed 2");

    // operation-newer is FAILED with a result message -> info action present
    expect(
      screen.getByRole("button", { name: "Show message details" })
    ).toBeTruthy();
    // PASSED operation has no status message -> only one info action overall
    expect(
      screen.getAllByRole("button", { name: "Show message details" })
    ).toHaveLength(1);
  });

  it("opens the message dialog with the failure message when the info action is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await screen.findByText("Technical Reseed 2");
    await user.click(
      screen.getByRole("button", { name: "Show message details" })
    );

    expect(
      await screen.findByText("failed because of a backend error")
    ).toBeTruthy();
  });

  it("disables launch when the execution group does not allow launches", async () => {
    const { fixture } = await renderComponent(false);

    await waitFor(() =>
      expect(fixture.componentInstance.launchDisabled()).toBe(true)
    );
    expect(fixture.componentInstance.launchTooltip()).toBe("Launches disabled");
  });

  it("launches technical reseed with the selected final product details", async () => {
    const { fixture } = await renderComponent();
    const launchedSpy = jest.fn();
    fixture.componentInstance.reloadRequested.subscribe(launchedSpy);

    await waitFor(() =>
      expect(fixture.componentInstance.operations().length).toBeGreaterThan(0)
    );

    fixture.componentInstance.launchForm.setValue({
      finalProduct: FINAL_PRODUCT,
      environmentDefinition: ENVIRONMENT_DEFINITION,
      maintenanceConfiguration: { full: true },
      pauseForManualIntervention: false,
    });
    fixture.componentInstance.launchTechnicalReseed();

    expect(
      mockTechnicalReseedService.launchTechnicalReseed
    ).toHaveBeenCalledWith("project-001", "reseed-group-001", {
      branch: "release/branch",
      configurationCommitId: "commit-001",
      validationLevel: "MQG",
      environmentDefinitionId: "env-def-001",
      maintenanceConfiguration: { full: true },
      infraGroupId: "infra-group-001",
      targetBranch: "feature/temp-branch",
      pauseForManualIntervention: false,
    });
    expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
      "Technical reseed operation launched successfully."
    );
    expect(launchedSpy).toHaveBeenCalled();
  });

  it("shows an error toast when launching fails", async () => {
    const { fixture } = await renderComponent();
    mockTechnicalReseedService.launchTechnicalReseed.mockReturnValue(
      throwError(() => new Error("launch failed"))
    );

    await waitFor(() =>
      expect(fixture.componentInstance.operations().length).toBeGreaterThan(0)
    );

    fixture.componentInstance.launchForm.setValue({
      finalProduct: FINAL_PRODUCT,
      environmentDefinition: ENVIRONMENT_DEFINITION,
      maintenanceConfiguration: { full: false },
      pauseForManualIntervention: false,
    });
    fixture.componentInstance.launchTechnicalReseed();

    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      "launch failed",
      "Failed to launch technical reseed operation"
    );
  });

  it("sends pauseForManualIntervention as false by default", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.operations().length).toBeGreaterThan(0)
    );

    fixture.componentInstance.launchForm.setValue({
      finalProduct: FINAL_PRODUCT,
      environmentDefinition: ENVIRONMENT_DEFINITION,
      maintenanceConfiguration: { full: true },
      pauseForManualIntervention: false,
    });
    fixture.componentInstance.launchTechnicalReseed();

    expect(
      mockTechnicalReseedService.launchTechnicalReseed
    ).toHaveBeenCalledWith(
      "project-001",
      "reseed-group-001",
      expect.objectContaining({ pauseForManualIntervention: false })
    );
  });

  it("sends pauseForManualIntervention as true when the checkbox is checked", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.operations().length).toBeGreaterThan(0)
    );

    fixture.componentInstance.launchForm.setValue({
      finalProduct: FINAL_PRODUCT,
      environmentDefinition: ENVIRONMENT_DEFINITION,
      maintenanceConfiguration: { full: true },
      pauseForManualIntervention: true,
    });
    fixture.componentInstance.launchTechnicalReseed();

    expect(
      mockTechnicalReseedService.launchTechnicalReseed
    ).toHaveBeenCalledWith(
      "project-001",
      "reseed-group-001",
      expect.objectContaining({ pauseForManualIntervention: true })
    );
  });

  describe("Pending Operations and Resume", () => {
    async function renderWithPausedOperation() {
      mockTechnicalReseedService.getExecutionGroupDetails.mockReturnValue(
        of({
          executionGroupId: "reseed-group-001",
          status: TechnicalReseedExecutionGroupStatus.ENABLED,
          launchesAllowed: true,
          technicalReseedOperations: [
            {
              id: "operation-paused",
              status: TechnicalReseedStatus.PENDING_INPUT,
              branch: "release/branch",
              sourceCommit: "commit-paused",
              maintenanceLevel: "Full",
              environmentDefinitionId: "env-def-001",
              createdOn: "2026-06-03T10:00:00Z",
            },
          ],
        })
      );
      mockEnvironmentDefinitionService.getEnvironmentDefinitions.mockReturnValue(
        of([ENVIRONMENT_DEFINITION])
      );
      mockTechnicalReseedService.resumeTechnicalReseed.mockReturnValue(
        of(null)
      );

      return render(TechnicalReseedSectionComponent, {
        imports: [
          MockComponent(CommitIdDisplayComponent),
          MockComponent(DateDisplayComponent),
          MockComponent(MxevolveIconComponent),
          MockComponent(MxevolveIllustrationComponent),
          MockComponent(EnvironmentDefinitionDropdownComponent),
          MockComponent(FinalProductDropdownInputComponent),
        ],
        inputs: {
          projectId: "project-001",
          executionGroupId: "reseed-group-001",
          infraGroup: "infra-group-001",
          targetBranch: "feature/temp-branch",
        },
        providers: [],
        componentProviders: [
          {
            provide: TechnicalReseedService,
            useValue: mockTechnicalReseedService,
          },
          {
            provide: EnvironmentDefinitionService,
            useValue: mockEnvironmentDefinitionService,
          },
          { provide: ToastMessageService, useValue: mockToastMessageService },
        ],
      });
    }

    it("shows the Resume button for a paused operation", async () => {
      const user = userEvent.setup();
      await renderWithPausedOperation();

      await screen.findByText("Technical Reseed 1");
      await user.click(
        screen.getByRole("button", { name: "Toggle Technical Reseed 1" })
      );

      expect(screen.getByRole("button", { name: "Resume" })).toBeTruthy();
    });

    it("shows the message info action for a paused operation", async () => {
      await renderWithPausedOperation();

      await screen.findByText("Technical Reseed 1");
      expect(
        screen.getByRole("button", { name: "Show message details" })
      ).toBeTruthy();
    });

    it("opens the message dialog with the paused message when the info action is clicked", async () => {
      const user = userEvent.setup();
      await renderWithPausedOperation();

      await screen.findByText("Technical Reseed 1");
      await user.click(
        screen.getByRole("button", { name: "Show message details" })
      );

      expect(
        await screen.findByText(
          "Paused before dump generation, manual intervention is required before proceeding."
        )
      ).toBeTruthy();
    });

    it("does not show the Resume button for non-paused operations", async () => {
      await renderComponent();

      await screen.findByText("Technical Reseed 2");
      expect(screen.queryByRole("button", { name: "Resume" })).toBeNull();
    });

    it("calls resumeTechnicalReseed when the Resume button is clicked", async () => {
      const user = userEvent.setup();
      await renderWithPausedOperation();

      await screen.findByText("Technical Reseed 1");
      await user.click(
        screen.getByRole("button", { name: "Toggle Technical Reseed 1" })
      );
      await user.click(screen.getByRole("button", { name: "Resume" }));

      expect(
        mockTechnicalReseedService.resumeTechnicalReseed
      ).toHaveBeenCalledWith(
        "project-001",
        "reseed-group-001",
        "operation-paused"
      );
    });

    it("reloads the execution group and shows a success toast after a successful resume", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderWithPausedOperation();
      const launchedSpy = jest.fn();
      fixture.componentInstance.reloadRequested.subscribe(launchedSpy);

      await screen.findByText("Technical Reseed 1");
      // initial load triggers the details fetch once
      expect(
        mockTechnicalReseedService.getExecutionGroupDetails
      ).toHaveBeenCalledTimes(1);

      await user.click(
        screen.getByRole("button", { name: "Toggle Technical Reseed 1" })
      );
      await user.click(screen.getByRole("button", { name: "Resume" }));

      await waitFor(() =>
        expect(
          mockTechnicalReseedService.getExecutionGroupDetails
        ).toHaveBeenCalledTimes(2)
      );
      expect(
        mockTechnicalReseedService.getExecutionGroupDetails
      ).toHaveBeenLastCalledWith("project-001", "reseed-group-001");
      expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
        "Technical reseed operation resumed successfully."
      );
      expect(launchedSpy).toHaveBeenCalled();
    });

    it("clears the resuming state after a successful resume", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderWithPausedOperation();

      await screen.findByText("Technical Reseed 1");
      await user.click(
        screen.getByRole("button", { name: "Toggle Technical Reseed 1" })
      );
      await user.click(screen.getByRole("button", { name: "Resume" }));

      await waitFor(() =>
        expect(
          fixture.componentInstance
            .resumingOperationIds()
            .has("operation-paused")
        ).toBe(false)
      );
    });

    it("disables the Resume button while the resume request is in flight", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderWithPausedOperation();

      // pending request keeps the operation in the resuming state
      mockTechnicalReseedService.resumeTechnicalReseed.mockReturnValue(
        new Subject<void>()
      );

      await screen.findByText("Technical Reseed 1");
      await user.click(
        screen.getByRole("button", { name: "Toggle Technical Reseed 1" })
      );
      await user.click(screen.getByRole("button", { name: "Resume" }));

      expect(
        fixture.componentInstance.resumingOperationIds().has("operation-paused")
      ).toBe(true);
    });

    it("unsubscribes from the resume request when the component is destroyed", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderWithPausedOperation();

      const resume$ = new Subject<void>();
      mockTechnicalReseedService.resumeTechnicalReseed.mockReturnValue(resume$);

      await screen.findByText("Technical Reseed 1");
      await user.click(
        screen.getByRole("button", { name: "Toggle Technical Reseed 1" })
      );
      await user.click(screen.getByRole("button", { name: "Resume" }));

      expect(resume$.observed).toBe(true);

      fixture.destroy();

      expect(resume$.observed).toBe(false);
    });

    it("re-enables the Resume button and shows an error toast when the resume call fails", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderWithPausedOperation();

      mockTechnicalReseedService.resumeTechnicalReseed.mockReturnValue(
        throwError(() => new Error("resume rejected"))
      );

      await screen.findByText("Technical Reseed 1");
      await user.click(
        screen.getByRole("button", { name: "Toggle Technical Reseed 1" })
      );
      await user.click(screen.getByRole("button", { name: "Resume" }));

      expect(
        fixture.componentInstance.resumingOperationIds().has("operation-paused")
      ).toBe(false);
      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "resume rejected",
        "Failed to resume technical reseed operation"
      );
    });
  });
});
