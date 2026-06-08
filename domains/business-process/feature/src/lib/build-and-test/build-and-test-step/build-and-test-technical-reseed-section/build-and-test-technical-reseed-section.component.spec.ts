import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent } from "ng-mocks";
import { of, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { BusinessProcessContentContainerComponent } from "@mxevolve/domains/business-process/ui";
import {
  EnvironmentDefinitionStatus,
  EnvironmentService,
  TechnicalReseedExecutionGroupStatus,
  TechnicalReseedService,
  TechnicalReseedStatus,
} from "@mxevolve/domains/environment/data-access";
import {
  FinalProduct,
  FinalProductService,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import {
  CommitIdDisplayComponent,
  DateDisplayComponent,
  MxevolveIconComponent,
  MxevolveIllustrationComponent,
} from "@mxevolve/shared/ui/primitive";
import { BuildAndTestTechnicalReseedSectionComponent } from "./build-and-test-technical-reseed-section.component";

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
};

const mockEnvironmentService = {
  getEnvironmentDefinitions: jest.fn(),
};

const mockFinalProductService = {
  getFinalProducts: jest.fn(),
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
  mockEnvironmentService.getEnvironmentDefinitions.mockReturnValue(
    of([
      {
        id: "env-def-001",
        name: "Small",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
    ])
  );
  mockFinalProductService.getFinalProducts.mockReturnValue(
    of({
      content: [FINAL_PRODUCT],
      totalPages: 1,
      totalElements: 1,
      size: 50,
      number: 0,
      last: true,
    })
  );
  mockTechnicalReseedService.launchTechnicalReseed.mockReturnValue(
    of({ requestId: "request-001" })
  );

  return render(BuildAndTestTechnicalReseedSectionComponent, {
    imports: [
      MockComponent(BusinessProcessContentContainerComponent),
      MockComponent(CommitIdDisplayComponent),
      MockComponent(DateDisplayComponent),
      MockComponent(MxevolveIconComponent),
      MockComponent(MxevolveIllustrationComponent),
    ],
    inputs: {
      projectId: "project-001",
      executionGroupId: "reseed-group-001",
      infraGroup: "infra-group-001",
      targetBranch: "feature/temp-branch",
    },
    providers: [provideNoopAnimations()],
    componentProviders: [
      { provide: TechnicalReseedService, useValue: mockTechnicalReseedService },
      { provide: EnvironmentService, useValue: mockEnvironmentService },
      { provide: FinalProductService, useValue: mockFinalProductService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("BuildAndTestTechnicalReseedSectionComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads technical reseed execution group details from the legacy endpoint service", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(
        mockTechnicalReseedService.getExecutionGroupDetails
      ).toHaveBeenCalledWith("project-001", "reseed-group-001")
    );
  });

  it("sorts operations by created date descending and numbers them newest first", async () => {
    await renderComponent();

    await waitFor(() => expect(screen.getByText("Technical Reseed 2")));
    const newer = screen.getByText("Technical Reseed 2");
    const older = screen.getByText("Technical Reseed 1");

    expect(newer.compareDocumentPosition(older)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("keeps operation details collapsed by default", async () => {
    await renderComponent();

    await waitFor(() => expect(screen.getByText("Technical Reseed 2")));

    expect(screen.queryByText("Commit Id")).toBeNull();
  });

  it("expands operation details when the operation row is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await waitFor(() => expect(screen.getByText("Technical Reseed 2")));
    await user.click(screen.getByText("Technical Reseed 2"));

    expect(screen.getByText("Commit Id")).toBeTruthy();
    expect(screen.getByText("Small")).toBeTruthy();
  });

  it("disables launch when the execution group does not allow launches", async () => {
    const { fixture } = await renderComponent(false);

    await waitFor(() => expect(fixture.componentInstance.launchDisabled()).toBe(true));
    expect(fixture.componentInstance.launchTooltip()).toBe("Launches disabled");
  });

  it("launches technical reseed with the legacy request body", async () => {
    const { fixture } = await renderComponent();
    const launchedSpy = jest.fn();
    fixture.componentInstance.operationLaunched.subscribe(launchedSpy);

    await waitFor(() => expect(fixture.componentInstance.finalProductOptions().length).toBe(1));

    fixture.componentInstance.launchForm.setValue({
      finalProduct: FINAL_PRODUCT,
      environmentDefinitionId: "env-def-001",
      maintenanceConfiguration: { full: true },
    });
    fixture.componentInstance.launchTechnicalReseed();

    expect(mockTechnicalReseedService.launchTechnicalReseed).toHaveBeenCalledWith(
      "project-001",
      "reseed-group-001",
      {
        branch: "release/branch",
        configurationCommitId: "commit-001",
        validationLevel: "MQG",
        environmentDefinitionId: "env-def-001",
        maintenanceConfiguration: { full: true },
        infraGroupId: "infra-group-001",
        targetBranch: "feature/temp-branch",
      }
    );
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

    await waitFor(() => expect(fixture.componentInstance.finalProductOptions().length).toBe(1));

    fixture.componentInstance.launchForm.setValue({
      finalProduct: FINAL_PRODUCT,
      environmentDefinitionId: "env-def-001",
      maintenanceConfiguration: { full: false },
    });
    fixture.componentInstance.launchTechnicalReseed();

    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      "launch failed",
      "Failed to launch technical reseed operation"
    );
  });
});
