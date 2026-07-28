import { signal } from "@angular/core";
import { render } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { CardModule } from "primeng/card";
import { BinaryUpgradeExecutionsComponent } from "./binary-upgrade-executions.component";
import { BinaryUpgradeExecutionsTableComponent } from "./binary-upgrade-executions-table/binary-upgrade-executions-table.component";
import type {
  BinaryUpgradeExecutionsQueryRequest,
  BinaryUpgradeExecutionSummary,
} from "@mxevolve/domains/business-process/data-access";
import { UpgradeProcessListingService } from "@mxevolve/domains/business-process/data-access";
import type { BusinessProcessDefinition } from "@mxflow/features/business-process";
import { BusinessProcessDefinitionService } from "@mxflow/features/business-process";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

const PROJECT_ID = "project-123";

const MOCK_EXECUTION = {
  id: "exec-001",
  projectId: PROJECT_ID,
} as unknown as BinaryUpgradeExecutionSummary;

const MOCK_DEFINITION = {
  id: "def-001",
  name: "My Process",
} as unknown as BusinessProcessDefinition;

const MOCK_QUERY: BinaryUpgradeExecutionsQueryRequest = {
  page: 0,
  size: 25,
} as unknown as BinaryUpgradeExecutionsQueryRequest;

const mockUpgradeListingService = {
  getBinaryUpgradeExecutions: jest.fn(),
};

const mockBusinessProcessDefinitionService = {
  getBusinessProcessDefinitions: jest.fn(),
};

const mockProjectIdResolver = {
  resolve: jest.fn(),
  projectId: signal(PROJECT_ID),
};

const mockToastService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

async function renderComponent() {
  return render(BinaryUpgradeExecutionsComponent, {
    componentImports: [
      CardModule,
      MockComponent(BinaryUpgradeExecutionsTableComponent),
    ],
    componentProviders: [
      {
        provide: UpgradeProcessListingService,
        useValue: mockUpgradeListingService,
      },
      {
        provide: BusinessProcessDefinitionService,
        useValue: mockBusinessProcessDefinitionService,
      },
    ],
    providers: [
      {
        provide: ProjectIdRouteParamsResolverService,
        useValue: mockProjectIdResolver,
      },
      { provide: ToastMessageService, useValue: mockToastService },
    ],
  });
}

describe("BinaryUpgradeExecutionsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectIdResolver.resolve.mockReturnValue(PROJECT_ID);
    mockProjectIdResolver.projectId.set(PROJECT_ID);
    mockBusinessProcessDefinitionService.getBusinessProcessDefinitions.mockReturnValue(
      of([MOCK_DEFINITION])
    );
    mockUpgradeListingService.getBinaryUpgradeExecutions.mockReturnValue(
      of({ content: [MOCK_EXECUTION], totalElements: 1 })
    );
  });

  it("renders the table component", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(fixture, BinaryUpgradeExecutionsTableComponent);

    expect(table).toBeTruthy();
  });

  it("calls getBusinessProcessDefinitions with the resolved project ID on init", async () => {
    await renderComponent();

    expect(
      mockBusinessProcessDefinitionService.getBusinessProcessDefinitions
    ).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
    });
  });

  it("reloads business process definitions when the project changes", async () => {
    const NEW_PROJECT_ID = "project-456";
    const { fixture } = await renderComponent();

    mockProjectIdResolver.projectId.set(NEW_PROJECT_ID);
    fixture.detectChanges();

    expect(
      mockBusinessProcessDefinitionService.getBusinessProcessDefinitions
    ).toHaveBeenCalledWith({
      projectId: NEW_PROJECT_ID,
    });
  });

  it("passes the resolved project ID to the table", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(fixture, BinaryUpgradeExecutionsTableComponent);

    expect(ngMocks.input(table, "projectId")).toBe(PROJECT_ID);
  });

  it("calls getBinaryUpgradeExecutions when the table emits paginationParamsChangeEmitter", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(fixture, BinaryUpgradeExecutionsTableComponent);

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);

    expect(
      mockUpgradeListingService.getBinaryUpgradeExecutions
    ).toHaveBeenCalledWith(PROJECT_ID, MOCK_QUERY);
  });

  it("passes the loaded executions to the table after query emits", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(fixture, BinaryUpgradeExecutionsTableComponent);

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);
    fixture.detectChanges();

    expect(ngMocks.input(table, "executions")).toEqual([MOCK_EXECUTION]);
  });

  it("passes totalRecords to the table after executions load", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(fixture, BinaryUpgradeExecutionsTableComponent);

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);
    fixture.detectChanges();

    expect(ngMocks.input(table, "totalRecords")).toBe(1);
  });

  it("shows an error toast when getBinaryUpgradeExecutions fails", async () => {
    mockUpgradeListingService.getBinaryUpgradeExecutions.mockReturnValue(
      throwError(() => "Fetch failed")
    );
    const { fixture } = await renderComponent();
    const table = ngMocks.find(fixture, BinaryUpgradeExecutionsTableComponent);

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);

    expect(mockToastService.showError).toHaveBeenCalledWith("Fetch failed");
  });
});
