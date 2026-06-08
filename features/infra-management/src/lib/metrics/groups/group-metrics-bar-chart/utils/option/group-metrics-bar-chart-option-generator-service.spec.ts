import { GroupMetricsBarChartModel } from "../../model/group-metrics-bar-chart-model";
import { GroupMetricsBarChartMapper } from "../mapper/group-metrics-bar-chart-mapper.service";
import {
  GroupMetricsBarChartOptionsGenerator,
  GroupMetricsGroupedBarData,
} from "./group-metrics-bar-chart-option-generator-service";
import { TestBed } from "@angular/core/testing";
import { GroupMetrics } from "../../../../../infra-groups/metrics/model/group-metrics";
import { AgBarSeriesOptions } from "ag-charts-enterprise";

const SINGLE_FAMILY_MODELS: GroupMetricsBarChartModel[] = [
  {
    groupName: "Group1",
    infraFamilyName: "FamilyA",
    remainingNumberOfAllocations: 10,
    threshold: 5,
    tooltipHtml: "<div>G1-FA</div>",
  },
];

const MULTI_GROUP_MULTI_FAMILY_MODELS: GroupMetricsBarChartModel[] = [
  {
    groupName: "Group1",
    infraFamilyName: "FamilyA",
    remainingNumberOfAllocations: 10,
    threshold: 5,
    tooltipHtml: "<div>G1-FA</div>",
  },
  {
    groupName: "Group1",
    infraFamilyName: "FamilyB",
    remainingNumberOfAllocations: 2,
    threshold: 5,
    tooltipHtml: "<div>G1-FB</div>",
  },
  {
    groupName: "Group2",
    infraFamilyName: "FamilyA",
    remainingNumberOfAllocations: 8,
    threshold: 5,
    tooltipHtml: "<div>G2-FA</div>",
  },
];

describe("Group metrics bar chart option generator", () => {
  let mapper: jest.Mocked<GroupMetricsBarChartMapper>;
  let optionsGenerator: GroupMetricsBarChartOptionsGenerator;

  beforeEach(() => {
    mapper = {
      map: jest.fn().mockReturnValue(SINGLE_FAMILY_MODELS),
    } as unknown as jest.Mocked<GroupMetricsBarChartMapper>;
    TestBed.configureTestingModule({
      providers: [
        { provide: GroupMetricsBarChartMapper, useValue: mapper },
        GroupMetricsBarChartOptionsGenerator,
      ],
    });
    optionsGenerator = TestBed.inject(GroupMetricsBarChartOptionsGenerator);
  });

  describe("toGroupedData", () => {
    it("should call mapper.map and return grouped data", () => {
      const groupMetrics: GroupMetrics[] = [];
      const result = optionsGenerator.toGroupedData(groupMetrics);
      expect(mapper.map).toHaveBeenCalledWith(groupMetrics, 0);
      expect(result.families).toEqual(["FamilyA"]);
      expect(result.data).toHaveLength(1);
    });

    it("should pass defaultThreshold to mapper", () => {
      const groupMetrics: GroupMetrics[] = [];
      optionsGenerator.toGroupedData(groupMetrics, 15);
      expect(mapper.map).toHaveBeenCalledWith(groupMetrics, 15);
    });
  });

  describe("mapToGroupedData", () => {
    it("should return empty data and families for empty input", () => {
      const result = optionsGenerator.mapToGroupedData([]);
      expect(result.data).toEqual([]);
      expect(result.families).toEqual([]);
    });

    it("should produce one data row per group", () => {
      const result = optionsGenerator.mapToGroupedData(
        MULTI_GROUP_MULTI_FAMILY_MODELS
      );
      expect(result.data).toHaveLength(2);
    });

    it("should set groupName on each row", () => {
      const result = optionsGenerator.mapToGroupedData(SINGLE_FAMILY_MODELS);
      expect(result.data[0].groupName).toBe("Group1");
    });

    it("should add minimum base height to values", () => {
      const result = optionsGenerator.mapToGroupedData(SINGLE_FAMILY_MODELS);
      // maxGroupTotal=10, minSegment=max(3, ceil(10*0.08))=3, so 10 becomes 3+10=13
      expect(result.data[0]["FamilyA"]).toBe(13);
    });

    it("should store real value in realValues record", () => {
      const result = optionsGenerator.mapToGroupedData(SINGLE_FAMILY_MODELS);
      expect(result.data[0].realValues["FamilyA"]).toBe(10);
    });

    it("should set threshold on each row", () => {
      const result = optionsGenerator.mapToGroupedData(SINGLE_FAMILY_MODELS);
      expect(result.data[0].threshold).toBe(5);
    });

    it("should set tooltipHtml in tooltips record keyed by family name", () => {
      const result = optionsGenerator.mapToGroupedData(SINGLE_FAMILY_MODELS);
      expect(result.data[0].tooltips["FamilyA"]).toBe("<div>G1-FA</div>");
    });

    it("should accumulate multiple families into one row per group with dynamic minimum", () => {
      const result = optionsGenerator.mapToGroupedData(
        MULTI_GROUP_MULTI_FAMILY_MODELS
      );
      const group1 = result.data.find((d) => d.groupName === "Group1")!;
      // maxGroupTotal=12, minSegment=max(3, ceil(12*0.08))=3
      expect(group1["FamilyA"]).toBe(13); // 3+10
      expect(group1["FamilyB"]).toBe(5); // 3+2
      expect(group1.realValues["FamilyA"]).toBe(10);
      expect(group1.realValues["FamilyB"]).toBe(2);
    });

    it("should scale minimum segment proportionally to max value", () => {
      const models: GroupMetricsBarChartModel[] = [
        {
          groupName: "G1",
          infraFamilyName: "Big",
          remainingNumberOfAllocations: 500,
          threshold: 5,
          tooltipHtml: "",
        },
        {
          groupName: "G1",
          infraFamilyName: "Zero",
          remainingNumberOfAllocations: 0,
          threshold: 5,
          tooltipHtml: "",
        },
      ];
      const result = optionsGenerator.mapToGroupedData(models);
      const row = result.data[0];
      // maxGroupTotal=500, minSegment=max(3, ceil(500*0.08))=40
      expect(row["Big"]).toBe(540); // 40+500
      expect(row["Zero"]).toBe(40); // 40+0
      expect(row.realValues["Zero"]).toBe(0);
    });

    it("should scale minimum using max group stacked total not max individual value", () => {
      const models: GroupMetricsBarChartModel[] = [
        // grp1: 2 families, low values
        {
          groupName: "grp1",
          infraFamilyName: "F1",
          remainingNumberOfAllocations: 0,
          threshold: 5,
          tooltipHtml: "",
        },
        {
          groupName: "grp1",
          infraFamilyName: "F2",
          remainingNumberOfAllocations: 10,
          threshold: 5,
          tooltipHtml: "",
        },
        // grp2: 5 families, each 30 => stacked total = 150
        {
          groupName: "grp2",
          infraFamilyName: "FA",
          remainingNumberOfAllocations: 30,
          threshold: 5,
          tooltipHtml: "",
        },
        {
          groupName: "grp2",
          infraFamilyName: "FB",
          remainingNumberOfAllocations: 30,
          threshold: 5,
          tooltipHtml: "",
        },
        {
          groupName: "grp2",
          infraFamilyName: "FC",
          remainingNumberOfAllocations: 30,
          threshold: 5,
          tooltipHtml: "",
        },
        {
          groupName: "grp2",
          infraFamilyName: "FD",
          remainingNumberOfAllocations: 30,
          threshold: 5,
          tooltipHtml: "",
        },
        {
          groupName: "grp2",
          infraFamilyName: "FE",
          remainingNumberOfAllocations: 30,
          threshold: 5,
          tooltipHtml: "",
        },
      ];
      const result = optionsGenerator.mapToGroupedData(models);
      const grp1 = result.data.find((d) => d.groupName === "grp1")!;
      // maxGroupTotal=150, minSegment=max(3, ceil(150*0.08))=12
      expect(grp1["F1"]).toBe(12); // 12+0
      expect(grp1["F2"]).toBe(22); // 12+10
      expect(grp1.realValues["F1"]).toBe(0);
      expect(grp1.realValues["F2"]).toBe(10);
    });

    it("should use floor when all values are very small", () => {
      const models: GroupMetricsBarChartModel[] = [
        {
          groupName: "G1",
          infraFamilyName: "Tiny",
          remainingNumberOfAllocations: 1,
          threshold: 5,
          tooltipHtml: "",
        },
      ];
      const result = optionsGenerator.mapToGroupedData(models);
      // maxGroupTotal=1, minSegment=max(3, ceil(1*0.08))=max(3,1)=3
      expect(result.data[0]["Tiny"]).toBe(4); // 3+1
      expect(result.data[0].realValues["Tiny"]).toBe(1);
    });

    it("should sort families by average remaining allocations ascending", () => {
      const result = optionsGenerator.mapToGroupedData(
        MULTI_GROUP_MULTI_FAMILY_MODELS
      );
      // FamilyB avg = 2, FamilyA avg = (10+8)/2 = 9 → FamilyB first
      expect(result.families).toEqual(["FamilyB", "FamilyA"]);
    });

    it("should sort families ascending when averages differ", () => {
      const models: GroupMetricsBarChartModel[] = [
        {
          groupName: "G1",
          infraFamilyName: "High",
          remainingNumberOfAllocations: 100,
          threshold: 5,
          tooltipHtml: "",
        },
        {
          groupName: "G1",
          infraFamilyName: "Low",
          remainingNumberOfAllocations: 1,
          threshold: 5,
          tooltipHtml: "",
        },
        {
          groupName: "G1",
          infraFamilyName: "Mid",
          remainingNumberOfAllocations: 50,
          threshold: 5,
          tooltipHtml: "",
        },
      ];
      const result = optionsGenerator.mapToGroupedData(models);
      expect(result.families).toEqual(["Low", "Mid", "High"]);
    });
  });

  describe("buildChartOptions", () => {
    const makeDatum = (
      overrides: Partial<GroupMetricsGroupedBarData> = {}
    ): GroupMetricsGroupedBarData => ({
      groupName: "Group1",
      threshold: 5,
      tooltips: { FamilyA: "" },
      realValues: { FamilyA: 10 },
      FamilyA: 10,
      ...overrides,
    });

    const buildOptions = (
      families: string[],
      data: GroupMetricsGroupedBarData[] = []
    ) => optionsGenerator.buildChartOptions({ data, families });

    it("should enable the legend at position top", () => {
      const options = buildOptions(["FamilyA"]);
      expect(options.legend?.enabled).toBe(true);
      expect(options.legend?.position).toBe("top");
    });

    it("should disable the context menu", () => {
      const options = buildOptions([]);
      expect(options.contextMenu?.enabled).toBe(false);
    });

    it("should produce one bar series per family", () => {
      const options = buildOptions(["FamilyA", "FamilyB", "FamilyC"]);
      expect(options.series).toHaveLength(3);
    });

    it("should produce no series when families list is empty", () => {
      const options = buildOptions([]);
      expect(options.series).toHaveLength(0);
    });

    it("each series should use xKey groupName", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as AgBarSeriesOptions[];
      expect(series[0].xKey).toBe("groupName");
    });

    it("each series should be stacked", () => {
      const options = buildOptions(["FamilyA", "FamilyB"]);
      const series = options.series as AgBarSeriesOptions[];
      expect(series[0].stacked).toBe(true);
      expect(series[1].stacked).toBe(true);
    });

    it("each series yKey and yName should be the family name", () => {
      const options = buildOptions(["FamilyA", "FamilyB"]);
      const series = options.series as AgBarSeriesOptions[];
      expect(series[0].yKey).toBe("FamilyA");
      expect(series[0].yName).toBe("FamilyA");
      expect(series[1].yKey).toBe("FamilyB");
      expect(series[1].yName).toBe("FamilyB");
    });

    it("should assign unique fills to each series via golden angle hue generation", () => {
      const options = buildOptions([
        "F1",
        "F2",
        "F3",
        "F4",
        "F5",
        "F6",
        "F7",
        "F8",
        "F9",
        "F10",
      ]);
      const series = options.series as AgBarSeriesOptions[];
      const fills = series.map((s) => s.fill);
      // All fills should be unique HSL strings
      expect(new Set(fills).size).toBe(10);
      fills.forEach((f) => expect(f).toMatch(/^hsl\(\d+, 65%, 55%\)$/));
    });

    it("itemStyler should return red fill when real value is below threshold", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as unknown as Record<string, unknown>[];
      const itemStyler = series[0]["itemStyler"] as (
        params: Record<string, unknown>
      ) => Record<string, unknown>;
      const datum = makeDatum({
        realValues: { FamilyA: 2 },
        FamilyA: 3,
        threshold: 5,
      });
      expect(itemStyler({ datum, yKey: "FamilyA" })).toEqual({
        fill: "#red600",
      });
    });

    it("itemStyler should return empty object when real value equals threshold", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as unknown as Record<string, unknown>[];
      const itemStyler = series[0]["itemStyler"] as (
        params: Record<string, unknown>
      ) => Record<string, unknown>;
      const datum = makeDatum({
        realValues: { FamilyA: 5 },
        FamilyA: 5,
        threshold: 5,
      });
      expect(itemStyler({ datum, yKey: "FamilyA" })).toEqual({});
    });

    it("itemStyler should return empty object when real value is above threshold", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as unknown as Record<string, unknown>[];
      const itemStyler = series[0]["itemStyler"] as (
        params: Record<string, unknown>
      ) => Record<string, unknown>;
      const datum = makeDatum({
        realValues: { FamilyA: 10 },
        FamilyA: 10,
        threshold: 5,
      });
      expect(itemStyler({ datum, yKey: "FamilyA" })).toEqual({});
    });

    it("should have label enabled on each series", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as AgBarSeriesOptions[];
      expect(series[0].label?.enabled).toBe(true);
    });

    it("label formatter should return real value as string for nonzero values", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as unknown as Record<string, unknown>[];
      const label = series[0]["label"] as Record<string, unknown>;
      const formatter = label["formatter"] as (p: {
        datum: GroupMetricsGroupedBarData;
        yKey: string;
      }) => string;
      const datum = makeDatum({ realValues: { FamilyA: 5 } });
      expect(formatter({ datum, yKey: "FamilyA" })).toBe("5");
    });

    it("label formatter should show zero values as '0'", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as unknown as Record<string, unknown>[];
      const label = series[0]["label"] as Record<string, unknown>;
      const formatter = label["formatter"] as (p: {
        datum: GroupMetricsGroupedBarData;
        yKey: string;
      }) => string;
      const datum = makeDatum({ realValues: { FamilyA: 0 } });
      expect(formatter({ datum, yKey: "FamilyA" })).toBe("0");
    });

    it("should use nearest range for tooltip on each series", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as AgBarSeriesOptions[];
      expect(series[0].tooltip?.range).toBe("nearest");
    });

    it("tooltip renderer should return the tooltip for the correct family", () => {
      const options = buildOptions(["FamilyA"]);
      const series = options.series as unknown as Record<string, unknown>[];
      const tooltip = series[0]["tooltip"] as Record<string, unknown>;
      const renderer = tooltip["renderer"] as (
        params: Record<string, unknown>
      ) => string;
      const datum = makeDatum({ tooltips: { FamilyA: "<b>tip</b>" } });
      expect(renderer({ datum })).toBe("<b>tip</b>");
    });

    it("should have a category axis at the bottom", () => {
      const options = buildOptions([]);
      expect(
        (options.axes as unknown as Record<string, unknown>[])?.[0]
      ).toMatchObject({
        type: "category",
        position: "bottom",
      });
    });

    it("should have a number axis on the left with labels disabled and no title", () => {
      const options = buildOptions([]);
      expect(
        (options.axes as unknown as Record<string, unknown>[])?.[1]
      ).toStrictEqual({
        type: "number",
        position: "left",
        label: { enabled: false },
        crosshair: { enabled: false },
      });
    });

    it("should pass the data array to chart options", () => {
      const data = [makeDatum()];
      const options = buildOptions(["FamilyA"], data);
      expect(options.data).toBe(data);
    });
  });
});
