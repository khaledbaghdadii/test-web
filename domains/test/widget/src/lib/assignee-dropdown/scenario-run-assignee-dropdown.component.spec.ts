import { render, waitFor } from "@testing-library/angular";
import { of, throwError } from "rxjs";
import { MockComponent, ngMocks } from "ng-mocks";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionService,
  ScenarioRunService,
  TestDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { UserService } from "@mxflow/features/user";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ScenarioRunAssigneeDropdownComponent } from "./scenario-run-assignee-dropdown.component";

const MOCK_IMPORTS = [MockComponent(MxevolveSingleSelectDropdownComponent)];

const mockScenarioRunService = {
  updateAssignee: jest.fn(),
};

const mockScenarioDefinitionService = {
  getScenarioDefinitionById: jest.fn(),
};

const mockUserService = {
  getUsersByBpcIds: jest.fn(),
  getUserById: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  scenarioDefinitionId: "sd-456",
  contextId: "ctx-789",
};

async function renderComponent(inputs = {}) {
  return render(ScenarioRunAssigneeDropdownComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ScenarioRunService, useValue: mockScenarioRunService },
      {
        provide: ScenarioDefinitionService,
        useValue: mockScenarioDefinitionService,
      },
      { provide: UserService, useValue: mockUserService },
      { provide: TestDefinitionService, useValue: {} },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
}

describe("ScenarioRunAssigneeDropdownComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
      of({ bpcs: ["bpc-1", "bpc-2"] })
    );
    mockScenarioRunService.updateAssignee.mockReturnValue(of(undefined));
  });

  it("fetches the scenario definition on init", async () => {
    await renderComponent();

    expect(
      mockScenarioDefinitionService.getScenarioDefinitionById
    ).toHaveBeenCalledWith("sd-456", "project-123");
  });

  it("shows an error toast when fetching scenario definition fails", async () => {
    mockScenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
      throwError(() => new Error("fetch failed"))
    );

    await renderComponent();

    expect(mockToastService.showError).toHaveBeenCalledWith(
      "Failed to load assignee options."
    );
  });

  it("renders the dropdown after scenario definition loads", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        ngMocks.find(fixture, MxevolveSingleSelectDropdownComponent, null)
      ).toBeTruthy();
    });
  });

  it("calls updateAssignee when a user is selected", async () => {
    const { fixture } = await renderComponent();

    const dropdown = ngMocks.find(
      fixture,
      MxevolveSingleSelectDropdownComponent
    );
    ngMocks.output(dropdown, "selectionChange").emit({
      id: "user-1",
      displayName: "User One",
      mail: "user1@test.com",
    });
    fixture.detectChanges();

    expect(mockScenarioRunService.updateAssignee).toHaveBeenCalledWith(
      "project-123",
      {
        assignee: "user-1",
        scenarioDefinitionId: "sd-456",
        contextId: "ctx-789",
        subContextId: undefined,
      }
    );
  });

  it("emits assigneeChanged on successful update", async () => {
    const { fixture } = await renderComponent();
    const assigneeChangedSpy = jest.fn();
    fixture.componentInstance.assigneeChanged.subscribe(assigneeChangedSpy);

    const dropdown = ngMocks.find(
      fixture,
      MxevolveSingleSelectDropdownComponent
    );
    ngMocks.output(dropdown, "selectionChange").emit({
      id: "user-1",
      displayName: "User One",
      mail: "user1@test.com",
    });
    fixture.detectChanges();

    expect(assigneeChangedSpy).toHaveBeenCalledWith("user-1");
  });

  it("shows an error toast when updating assignee fails", async () => {
    mockScenarioRunService.updateAssignee.mockReturnValue(
      throwError(() => new Error("update failed"))
    );

    const { fixture } = await renderComponent();

    const dropdown = ngMocks.find(
      fixture,
      MxevolveSingleSelectDropdownComponent
    );
    ngMocks.output(dropdown, "selectionChange").emit({
      id: "user-1",
      displayName: "User One",
      mail: "user1@test.com",
    });
    fixture.detectChanges();

    expect(mockToastService.showError).toHaveBeenCalledWith(
      "Failed to update assignee."
    );
  });

  it("does not call updateAssignee when same user is re-selected", async () => {
    const { fixture } = await renderComponent();

    const dropdown = ngMocks.find(
      fixture,
      MxevolveSingleSelectDropdownComponent
    );
    const user = {
      id: "user-1",
      displayName: "User One",
      mail: "user1@test.com",
    };

    ngMocks.output(dropdown, "selectionChange").emit(user);
    fixture.detectChanges();

    ngMocks.output(dropdown, "selectionChange").emit(user);
    fixture.detectChanges();

    expect(mockScenarioRunService.updateAssignee).toHaveBeenCalledTimes(1);
  });
});
