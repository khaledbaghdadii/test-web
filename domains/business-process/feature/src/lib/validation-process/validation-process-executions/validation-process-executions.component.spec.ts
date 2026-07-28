import { signal } from "@angular/core";
import { render } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { CardModule } from "primeng/card";
import { ValidationProcessExecutionsComponent } from "./validation-process-executions.component";
import { ValidationProcessExecutionsTableComponent } from "./validation-process-executions-table/validation-process-executions-table.component";
import type {
  ValidationProcessExecution,
  ValidationProcessExecutionsQueryRequest,
} from "@mxevolve/domains/business-process/data-access";
import {
  ValidationProcessExecutionMapperService,
  ValidationProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import type { BusinessProcessDefinition } from "@mxflow/features/business-process";
import { BusinessProcessDefinitionService } from "@mxflow/features/business-process";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

const PROJECT_ID = "project-123";

const MOCK_EXECUTION = {
  id: "exec-001",
  projectId: PROJECT_ID,
  status: "COMPLETED",
} as unknown as ValidationProcessExecution;

const MOCK_DEFINITION = {
  id: "def-001",
  name: "My Process",
} as unknown as BusinessProcessDefinition;

const MOCK_QUERY: ValidationProcessExecutionsQueryRequest = {
  page: 0,
  size: 25,
};

const mockValidationListingService = {
  getValidationProcessExecutions: jest.fn(),
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
  return render(ValidationProcessExecutionsComponent, {
    componentImports: [
      CardModule,
      MockComponent(ValidationProcessExecutionsTableComponent),
    ],
    componentProviders: [
      {
        provide: ValidationProcessListingService,
        useValue: mockValidationListingService,
      },
      {
        provide: BusinessProcessDefinitionService,
        useValue: mockBusinessProcessDefinitionService,
      },
      {
        provide: ValidationProcessExecutionMapperService,
        useValue: {},
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

describe("ValidationProcessExecutionsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectIdResolver.resolve.mockReturnValue(PROJECT_ID);
    mockProjectIdResolver.projectId.set(PROJECT_ID);
    mockBusinessProcessDefinitionService.getBusinessProcessDefinitions.mockReturnValue(
      of([MOCK_DEFINITION])
    );
    mockValidationListingService.getValidationProcessExecutions.mockReturnValue(
      of({ executions: [MOCK_EXECUTION], total: 1, last: true })
    );
  });

  it("renders the table component", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

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
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    expect(ngMocks.input(table, "projectId")).toBe(PROJECT_ID);
  });

  it("passes business process definitions to the table after loading", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    expect(ngMocks.input(table, "businessProcessDefinitions")).toEqual([
      MOCK_DEFINITION,
    ]);
  });

  it("sets isLoading to true on init before executions are fetched", async () => {
    mockValidationListingService.getValidationProcessExecutions.mockReturnValue(
      of({ executions: [], total: 0, last: true })
    );
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    // isLoading starts true; after query emits it becomes false
    // Before any query is emitted, isLoading remains true
    expect(ngMocks.input(table, "isLoading")).toBe(true);
  });

  it("calls getValidationProcessExecutions when the table emits paginationParamsChangeEmitter", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);

    expect(
      mockValidationListingService.getValidationProcessExecutions
    ).toHaveBeenCalledWith(PROJECT_ID, MOCK_QUERY);
  });

  it("passes the loaded executions to the table after query emits", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);
    fixture.detectChanges();

    expect(ngMocks.input(table, "executions")).toEqual([MOCK_EXECUTION]);
  });

  it("passes totalRecords to the table after executions load", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);
    fixture.detectChanges();

    expect(ngMocks.input(table, "totalRecords")).toBe(1);
  });

  it("sets isLoading to false after executions load", async () => {
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);
    fixture.detectChanges();

    expect(ngMocks.input(table, "isLoading")).toBe(false);
  });

  it("shows an error toast when getValidationProcessExecutions fails", async () => {
    mockValidationListingService.getValidationProcessExecutions.mockReturnValue(
      throwError(() => "Fetch failed")
    );
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);

    expect(mockToastService.showError).toHaveBeenCalledWith("Fetch failed");
  });

  it("sets isLoading to false after an error", async () => {
    mockValidationListingService.getValidationProcessExecutions.mockReturnValue(
      throwError(() => "Fetch failed")
    );
    const { fixture } = await renderComponent();
    const table = ngMocks.find(
      fixture,
      ValidationProcessExecutionsTableComponent
    );

    ngMocks.output(table, "paginationParamsChangeEmitter").emit(MOCK_QUERY);
    fixture.detectChanges();

    expect(ngMocks.input(table, "isLoading")).toBe(false);
  });
});
