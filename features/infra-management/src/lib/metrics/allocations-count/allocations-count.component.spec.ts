import { TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";

import { AllocationsCountComponent } from "./allocations-count.component";
import {
  AllocationMetrics,
  InfraAllocationsService,
} from "@mxflow/features/infra-management";
import { InputSignal, signal } from "@angular/core";

const PROJECT_ID = "PROJECT_ID";
const MOCK_METRICS = {
  states: { queued: 5, failed: 2, deallocationFailed: 1 },
};

const metricsSubject = new BehaviorSubject(MOCK_METRICS);

describe("AllocationsCountComponent", () => {
  let component: AllocationsCountComponent;

  const serviceMock = {
    getAllocationMetrics: jest.fn().mockReturnValue(metricsSubject),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AllocationsCountComponent,
        { provide: InfraAllocationsService, useValue: serviceMock },
      ],
    });

    component = TestBed.inject(AllocationsCountComponent);
    component.projectId = signal(PROJECT_ID) as unknown as InputSignal<string>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should call the service with the projectId", () => {
      component.ngOnInit();
      expect(serviceMock.getAllocationMetrics).toHaveBeenCalledWith(PROJECT_ID);
    });

    it("should store the metrics in the signal", () => {
      component.ngOnInit();
      expect(component.infraAllocationMetrics()).toEqual(MOCK_METRICS);
    });
  });

  describe("dataExists", () => {
    it("should return true when metrics have data", () => {
      component.infraAllocationMetrics.set(MOCK_METRICS);
      expect(component.dataExists()).toBe(true);
    });

    it("should return false when metrics are undefined", () => {
      component.infraAllocationMetrics.set(undefined);
      expect(component.dataExists()).toBe(false);
    });

    it("should return false when all counts are zero", () => {
      component.infraAllocationMetrics.set({
        states: { queued: 0, failed: 0, deallocationFailed: 0 },
      });
      expect(component.dataExists()).toBe(false);
    });

    it("should return true when only one count is non-zero", () => {
      component.infraAllocationMetrics.set({
        states: { queued: 1, failed: 0, deallocationFailed: 0 },
      });
      expect(component.dataExists()).toBe(true);
    });
  });

  describe("mapToChartData", () => {
    it("should map metrics to chart data format", () => {
      const chartData = component.mapToChartData(MOCK_METRICS);

      expect(chartData).toEqual([
        {
          type: "Queued",
          count: 5,
          tooltip: "Total number of allocations with state queued: 5",
        },
        {
          type: "Failed",
          count: 2,
          tooltip: "Total number of allocations with state failed: 2",
        },
        {
          type: "Deallocation Failed",
          count: 1,
          tooltip:
            "Total number of allocations with state deallocation failed: 1",
        },
      ]);
    });

    it("should return empty array when metrics are undefined", () => {
      const chartData = component.mapToChartData(undefined);
      expect(chartData).toEqual([]);
    });

    it("should return empty array when states are undefined", () => {
      const chartData = component.mapToChartData({} as AllocationMetrics);
      expect(chartData).toEqual([]);
    });

    it("should handle null values in states", () => {
      const chartData = component.mapToChartData({
        states: { queued: null, failed: null, deallocationFailed: null },
      } as unknown as AllocationMetrics);

      expect(chartData).toEqual([
        {
          type: "Queued",
          count: 0,
          tooltip: "Total number of allocations with state queued: 0",
        },
        {
          type: "Failed",
          count: 0,
          tooltip: "Total number of allocations with state failed: 0",
        },
        {
          type: "Deallocation Failed",
          count: 0,
          tooltip:
            "Total number of allocations with state deallocation failed: 0",
        },
      ]);
    });
  });

  describe("buildChartOptions", () => {
    it("should build chart options with horizontal bar series", () => {
      const options = component.buildChartOptions(MOCK_METRICS);

      expect(options.series).toHaveLength(1);
      expect(options.series![0]).toMatchObject({
        type: "bar",
        xKey: "type",
        yKey: "count",
        direction: "horizontal",
      });
    });

    it("should configure axes with category on left and number on bottom", () => {
      const options = component.buildChartOptions(MOCK_METRICS);

      expect(options.axes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "category", position: "left" }),
          expect.objectContaining({ type: "number", position: "bottom" }),
        ])
      );
    });

    it("should disable legend", () => {
      const options = component.buildChartOptions(MOCK_METRICS);
      expect(options.legend).toEqual({ enabled: false });
    });

    it("should include chart data", () => {
      const options = component.buildChartOptions(MOCK_METRICS);
      expect(options.data).toHaveLength(3);
    });

    it("should configure tooltip renderer that returns tooltip string", () => {
      const options = component.buildChartOptions(MOCK_METRICS);
      const series = options.series![0] as unknown as {
        tooltip: {
          renderer: (params: { datum: { tooltip: string } }) => string;
        };
      };
      const result = series.tooltip.renderer({
        datum: { tooltip: "Test tooltip" },
      });
      expect(result).toEqual("Test tooltip");
    });

    it("should enable labels on bars", () => {
      const options = component.buildChartOptions(MOCK_METRICS);
      const series = options.series![0] as { label: { enabled: boolean } };
      expect(series.label.enabled).toBe(true);
    });
  });

  describe("chartOptions computed signal", () => {
    it("should update when metrics change", () => {
      component.infraAllocationMetrics.set(MOCK_METRICS);
      const options1 = component.chartOptions();
      expect(options1.data).toHaveLength(3);

      component.infraAllocationMetrics.set({
        states: { queued: 10, failed: 20, deallocationFailed: 30 },
      });
      const options2 = component.chartOptions();
      expect(options2.data![0]).toMatchObject({ count: 10 });
    });
  });
});
