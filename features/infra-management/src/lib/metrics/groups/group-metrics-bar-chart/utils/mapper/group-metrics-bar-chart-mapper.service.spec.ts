import { GroupMetricsBarChartMapper } from "./group-metrics-bar-chart-mapper.service";
import {
  AllocationRequestType,
  GroupMetrics,
  ServerType,
} from "@mxflow/features/infra-management";

describe("GroupMetricsBarChartMapper", () => {
  let mapper: GroupMetricsBarChartMapper;

  beforeEach(() => {
    mapper = new GroupMetricsBarChartMapper();
  });

  it("should map group metrics with no failure details and no infra family", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g1", name: "Group 1", projectId: "p1" },
        groupInfraFamilyMetrics: [
          {
            id: "1",
            remainingNumberOfAllocations: 5,
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(1);
    expect(result[0].groupName).toBe("Group 1");
    expect(result[0].infraFamilyName).toBe("No Infra Family");
    expect(result[0].remainingNumberOfAllocations).toBe(5);
    expect(result[0].tooltipHtml).toContain("Group Name:");
    expect(result[0].tooltipHtml).toContain("Remaining number of allocations:");
    expect(result[0].tooltipHtml).not.toContain("Infra Family:");
    expect(result[0].tooltipHtml).not.toContain("Reason:");
  });

  it("should map group metrics with infra family", () => {
    const input: GroupMetrics[] = [
      {
        group: {
          id: "g1",
          name: "Group 1",
          projectId: "p1",
        },
        groupInfraFamilyMetrics: [
          {
            id: "1",
            remainingNumberOfAllocations: 5,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f1", name: "Family 1" } },
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(1);
    expect(result[0].groupName).toBe("Group 1");
    expect(result[0].infraFamilyName).toBe("Family 1");
    expect(result[0].tooltipHtml).toContain("Infra Family:");
    expect(result[0].tooltipHtml).toContain("Family 1");
  });

  it("should map group metrics with failedDatabaseInstanceAllocationRequest", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g2", name: "Group 2", projectId: "p2" },
        groupInfraFamilyMetrics: [
          {
            id: "2",
            remainingNumberOfAllocations: 3,
            allocationFailureDetails: {
              failedDatabaseInstanceAllocationRequest: {
                databaseSnapshotId: "snap-123",
                type: AllocationRequestType.DATABASE_INSTANCE,
              },
            },
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(1);
    expect(result[0].groupName).toBe("Group 2");
    expect(result[0].remainingNumberOfAllocations).toBe(3);
    expect(result[0].tooltipHtml).toContain("Group Name:");
    expect(result[0].tooltipHtml).toContain("Remaining number of allocations:");
    expect(result[0].tooltipHtml).toContain("Reason:");
    expect(result[0].tooltipHtml).toContain("DB Snapshot Id: snap-123");
  });

  it("should map group metrics with failedMachineResourceAllocationRequest and server types", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g3", name: "Group 3", projectId: "p3" },
        groupInfraFamilyMetrics: [
          {
            id: "3",
            remainingNumberOfAllocations: 2,
            allocationFailureDetails: {
              failedMachineResourceAllocationRequest: {
                type: AllocationRequestType.MACHINE_RESOURCE,
                servers: [
                  { type: ServerType.APPLICATION },
                  { type: ServerType.CLIENT },
                ],
              },
            },
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(1);
    expect(result[0].groupName).toBe("Group 3");
    expect(result[0].remainingNumberOfAllocations).toBe(2);
    expect(result[0].tooltipHtml).toContain("Group Name:");
    expect(result[0].tooltipHtml).toContain("Remaining number of allocations:");
    expect(result[0].tooltipHtml).toContain("Allocation Limit Reason:");
    expect(result[0].tooltipHtml).toContain(
      "low resources on machines of type:"
    );
    expect(result[0].tooltipHtml).toContain("APPLICATION, CLIENT");
  });

  it("should map group metrics with failedMachineResourceAllocationRequest and no servers", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g4", name: "Group 4", projectId: "p4" },
        groupInfraFamilyMetrics: [
          {
            id: "4",
            remainingNumberOfAllocations: 1,
            allocationFailureDetails: {
              failedMachineResourceAllocationRequest: {
                type: AllocationRequestType.MACHINE_RESOURCE,
                servers: [],
              },
            },
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(1);
    expect(result[0].groupName).toBe("Group 4");
    expect(result[0].remainingNumberOfAllocations).toBe(1);
    expect(result[0].tooltipHtml).toContain("Group Name:");
    expect(result[0].tooltipHtml).toContain("Remaining number of allocations:");
    expect(result[0].tooltipHtml).toContain("Allocation Limit Reason:");
    expect(result[0].tooltipHtml).toContain(
      "low resources on machines of type:"
    );
    expect(result[0].tooltipHtml).toContain("-");
  });

  it("should map group metrics with all families in groupInfraFamilyMetrics", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g1", name: "Group 1", projectId: "p1" },
        groupInfraFamilyMetrics: [
          {
            id: "1a",
            remainingNumberOfAllocations: 5,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f1", name: "Family 1" } },
          },
          {
            id: "1b",
            remainingNumberOfAllocations: 3,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f2", name: "Family 2" } },
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(2);
    expect(result[0].groupName).toBe("Group 1");
    expect(result[0].infraFamilyName).toBe("Family 1");
    expect(result[0].remainingNumberOfAllocations).toBe(5);
    expect(result[1].groupName).toBe("Group 1");
    expect(result[1].infraFamilyName).toBe("Family 2");
    expect(result[1].remainingNumberOfAllocations).toBe(3);
  });

  it("should sort groups by minimum remaining allocations across all families", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g1", name: "Group A", projectId: "p1" },
        groupInfraFamilyMetrics: [
          {
            id: "1a",
            remainingNumberOfAllocations: 10,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f1", name: "Family 1" } },
          },
          {
            id: "1b",
            remainingNumberOfAllocations: 2,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f2", name: "Family 2" } },
          },
        ],
      },
      {
        group: { id: "g2", name: "Group B", projectId: "p1" },
        groupInfraFamilyMetrics: [
          {
            id: "2a",
            remainingNumberOfAllocations: 4,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f1", name: "Family 1" } },
          },
          {
            id: "2b",
            remainingNumberOfAllocations: 7,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f2", name: "Family 2" } },
          },
        ],
      },
    ];
    const result = mapper.map(input);
    // Group A has min=2, Group B has min=4 → Group A first
    expect(result[0].groupName).toBe("Group A");
    expect(result[1].groupName).toBe("Group A");
    expect(result[2].groupName).toBe("Group B");
    expect(result[3].groupName).toBe("Group B");
  });

  it("should not map group metrics with undefined remainingNumberOfAllocations", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g5", name: "Group 5", projectId: "p5" },
        groupInfraFamilyMetrics: [
          {
            id: "5",
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(0);
  });

  it("should handle empty input", () => {
    const result = mapper.map([]);
    expect(result.length).toBe(0);
  });

  it("should map threshold edge cases correctly", () => {
    const threshold = 3;
    const input: GroupMetrics[] = [
      {
        group: {
          id: "g1",
          name: "Group 1",
          projectId: "p1",
          allocationNotificationThreshold: {
            threshold: threshold,
            inherited: false,
          },
        },
        groupInfraFamilyMetrics: [
          {
            id: "1",
            remainingNumberOfAllocations: 5,
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
      {
        group: { id: "g2", name: "Group 2", projectId: "p2" },
        groupInfraFamilyMetrics: [
          {
            id: "2",
            remainingNumberOfAllocations: 3,
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
      {
        group: {
          id: "g3",
          name: "Group 3",
          projectId: "p3",
          allocationNotificationThreshold: {
            threshold: threshold,
            inherited: true,
          },
        },
        groupInfraFamilyMetrics: [
          {
            id: "3",
            remainingNumberOfAllocations: 2,
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
      {
        group: {
          id: "g4",
          name: "Group 4",
          projectId: "p4",
          allocationNotificationThreshold: {
            threshold: 0,
            inherited: false,
          },
        },
        groupInfraFamilyMetrics: [
          {
            id: "4",
            remainingNumberOfAllocations: 0,
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(4);
    expect(result[0].groupName).toBe("Group 4"); // Sorted by remainingNumberOfAllocations
    expect(result[0].threshold).toBe(0);
    expect(result[1].groupName).toBe("Group 3");
    expect(result[1].threshold).toBe(3);
    expect(result[2].groupName).toBe("Group 2");
    expect(result[2].threshold).toBe(0);
    expect(result[3].groupName).toBe("Group 1");
    expect(result[3].threshold).toBe(threshold);
  });

  it("should use defaultThreshold when group has no allocationNotificationThreshold", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g1", name: "Group 1", projectId: "p1" },
        groupInfraFamilyMetrics: [
          {
            id: "1",
            remainingNumberOfAllocations: 5,
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input, 7);
    expect(result[0].threshold).toBe(7);
  });

  it("should prefer group threshold over defaultThreshold", () => {
    const input: GroupMetrics[] = [
      {
        group: {
          id: "g1",
          name: "Group 1",
          projectId: "p1",
          allocationNotificationThreshold: { threshold: 3, inherited: false },
        },
        groupInfraFamilyMetrics: [
          {
            id: "1",
            remainingNumberOfAllocations: 5,
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input, 7);
    expect(result[0].threshold).toBe(3);
  });

  it("should handle allocationFailureDetails present but both subfields undefined", () => {
    const input: GroupMetrics[] = [
      {
        group: { id: "g8", name: "Group 8", projectId: "p8" },
        groupInfraFamilyMetrics: [
          {
            id: "8",
            remainingNumberOfAllocations: 4,
            allocationFailureDetails: {},
            lastSyncedOn: new Date(),
            allocationRequest: {},
          },
        ],
      },
    ];
    const result = mapper.map(input);
    expect(result.length).toBe(1);
    expect(result[0].groupName).toBe("Group 8");
    expect(result[0].remainingNumberOfAllocations).toBe(4);
    expect(result[0].tooltipHtml).toContain("Group Name:");
    expect(result[0].tooltipHtml).toContain("Remaining number of allocations:");
    expect(result[0].tooltipHtml).not.toContain("Reason:");
  });
});
