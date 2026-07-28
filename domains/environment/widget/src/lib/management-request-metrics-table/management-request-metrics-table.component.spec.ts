import { render, waitFor } from "@testing-library/angular";
import { of, throwError } from "rxjs";
import { MockComponent } from "ng-mocks";
import { AgGridAngular } from "ag-grid-angular";
import {
  ManagementRequestMetricApiResponse,
  ManagementRequestMetricsService,
} from "@mxevolve/domains/environment/data-access";
import { DurationUtils } from "@mxevolve/domains/environment/util";
import { ManagementRequestMetricsTableComponent } from "./management-request-metrics-table.component";

const mockMetricsService = {
  getManagementRequestMetrics: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "proj-1",
  environmentId: "env-1",
  managementRequestId: "req-1",
};

const METRIC: ManagementRequestMetricApiResponse = {
  id: "m1",
  projectId: "proj-1",
  environmentId: "env-1",
  managementRequestId: "req-1",
  taskName: "Task A",
  startTime: "2023-01-01T10:00:00Z",
  endTime: "2023-01-01T11:00:00Z",
  duration: "PT1H",
};

async function renderComponent(
  inputs: Partial<typeof REQUIRED_INPUTS> = {}
): Promise<ManagementRequestMetricsTableComponent> {
  const view = await render(ManagementRequestMetricsTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: [MockComponent(AgGridAngular)],
    componentProviders: [
      {
        provide: ManagementRequestMetricsService,
        useValue: mockMetricsService,
      },
    ],
  });
  return view.fixture.componentInstance;
}

describe("ManagementRequestMetricsTableComponent", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockMetricsService.getManagementRequestMetrics.mockReturnValue(of([]));
  });

  it("creates the component", async () => {
    const component = await renderComponent();

    expect(component).toBeTruthy();
  });

  it("maps the task name into a row", async () => {
    mockMetricsService.getManagementRequestMetrics.mockReturnValue(
      of([METRIC])
    );

    const component = await renderComponent();

    await waitFor(() => expect(component.rowData()[0].task).toBe("Task A"));
  });

  it("maps the duration to seconds using DurationUtils", async () => {
    jest.spyOn(DurationUtils, "parseDurationToSeconds").mockReturnValue(3600);
    mockMetricsService.getManagementRequestMetrics.mockReturnValue(
      of([METRIC])
    );

    const component = await renderComponent();

    await waitFor(() =>
      expect(component.rowData()[0].durationSeconds).toBe(3600)
    );
  });

  it("computes the max duration across rows", async () => {
    jest
      .spyOn(DurationUtils, "parseDurationToSeconds")
      .mockReturnValueOnce(3600)
      .mockReturnValueOnce(7200);
    mockMetricsService.getManagementRequestMetrics.mockReturnValue(
      of([METRIC, { ...METRIC, id: "m2", duration: "PT2H" }])
    );

    const component = await renderComponent();

    await waitFor(() => expect(component.maxDurationInSeconds()).toBe(7200));
  });

  it("renders no rows when the metrics request fails", async () => {
    mockMetricsService.getManagementRequestMetrics.mockReturnValue(
      throwError(() => new Error("boom"))
    );

    const component = await renderComponent();

    await waitFor(() => expect(component.rowData()).toEqual([]));
  });
});
