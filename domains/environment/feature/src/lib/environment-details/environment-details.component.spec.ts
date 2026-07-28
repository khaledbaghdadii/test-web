import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { Toast } from "primeng/toast";
import { ProgressSpinner } from "primeng/progressspinner";
import {
  Environment,
  EnvironmentService,
  ManagementRequest,
  ManagementRequestService,
} from "@mxevolve/domains/environment/data-access";
// eslint-disable-next-line @nx/enforce-module-boundaries -- MFE project-graph cycle: shell loads environment-management (relative path) which lazy-loads this feature; accepted MFE architecture limitation.
import {
  EnvironmentActionsPanelComponent,
  EnvironmentDetailsHeaderComponent,
  EnvironmentDetailsInfoComponent,
  EnvironmentResourcesTabsComponent,
} from "@mxevolve/domains/environment/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { BreadcrumbComponent } from "@mxevolve/domains/analytics/widget";
import { EnvironmentDetailsComponent } from "./environment-details.component";

const MOCK_ENVIRONMENT: Environment = {
  id: "env-001",
  projectId: "proj-001",
  status: EnvironmentStatus.READY,
  databases: [],
  environmentActions: [],
  excludeFromShutdown: false,
};

const MOCK_REQUESTS: ManagementRequest[] = [];

const mockEnvService = {
  fetchByProjectAndEnvironmentId: jest.fn(),
};

const mockRequestsService = {
  fetchByProjectAndEnvironmentId: jest.fn(),
};

const mockToastService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
  clearErrors: jest.fn(),
};

const MOCK_ROUTE = {
  snapshot: {
    paramMap: convertToParamMap({ "environment-id": "env-001" }),
  },
  pathFromRoot: [
    { snapshot: { paramMap: convertToParamMap({ projectId: "proj-001" }) } },
  ],
};

async function renderComponent() {
  return render(EnvironmentDetailsComponent, {
    componentImports: [
      Toast,
      ProgressSpinner,
      MockComponent(EnvironmentDetailsHeaderComponent),
      MockComponent(EnvironmentDetailsInfoComponent),
      MockComponent(EnvironmentActionsPanelComponent),
      MockComponent(EnvironmentResourcesTabsComponent),
      MockComponent(BreadcrumbComponent),
    ],
    componentProviders: [
      { provide: EnvironmentService, useValue: mockEnvService },
      { provide: ManagementRequestService, useValue: mockRequestsService },
      { provide: ToastMessageService, useValue: mockToastService },
    ],
    providers: [{ provide: ActivatedRoute, useValue: MOCK_ROUTE }],
  });
}

describe("EnvironmentDetailsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnvService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(MOCK_ENVIRONMENT)
    );
    mockRequestsService.fetchByProjectAndEnvironmentId.mockReturnValue(
      of(MOCK_REQUESTS)
    );
  });

  it("renders the breadcrumb with the environment resource type and ids", async () => {
    const { fixture } = await renderComponent();

    const breadcrumb = ngMocks.find(fixture, BreadcrumbComponent);
    expect(ngMocks.input(breadcrumb, "resourceType")).toBe("ENVIRONMENT");
    expect(ngMocks.input(breadcrumb, "resourceId")).toBe("env-001");
    expect(ngMocks.input(breadcrumb, "projectId")).toBe("proj-001");
  });

  it("renders the environment details header panel", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(
        ngMocks.find(fixture, EnvironmentDetailsHeaderComponent)
      ).toBeTruthy()
    );
  });

  it("renders the environment details info panel", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(
        ngMocks.find(fixture, EnvironmentDetailsInfoComponent)
      ).toBeTruthy()
    );
  });

  it("renders the environment actions panel", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(
        ngMocks.find(fixture, EnvironmentActionsPanelComponent)
      ).toBeTruthy()
    );
  });

  it("renders the environment resources tabs panel", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(
        ngMocks.find(fixture, EnvironmentResourcesTabsComponent)
      ).toBeTruthy()
    );
  });

  it("renders an error state when the environment fetch fails", async () => {
    mockEnvService.fetchByProjectAndEnvironmentId.mockReturnValue(
      throwError(() => new Error("not found"))
    );

    await renderComponent();

    await waitFor(() =>
      expect(screen.getByText("Failed to load environment.")).toBeTruthy()
    );
  });

  it("calls toast showError when handlePanelError is invoked", async () => {
    const { fixture } = await renderComponent();
    await waitFor(() =>
      expect(
        ngMocks.find(fixture, EnvironmentDetailsHeaderComponent)
      ).toBeTruthy()
    );

    fixture.componentInstance.handlePanelError(new Error("connection failed"));

    expect(mockToastService.showError).toHaveBeenCalledWith(
      "connection failed"
    );
  });
});
