import { GroupMetricsBarChartStateService } from "./group-metrics-bar-chart-state.service";
import {
  AllocationNotificationThreshold,
  GroupMetrics,
  GroupMetricsPage,
  InfraGroupsService,
  ProjectInfraConfig,
  ProjectInfraConfigService,
  SimpleGroup,
} from "@mxflow/features/infra-management";
import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import {
  GroupedBarChartData,
  GroupMetricsBarChartOptionsGenerator,
} from "../utils/option/group-metrics-bar-chart-option-generator-service";

const PROJECT_ID = "project-id-1";
const GROUP_METRICS_ID_1 = "group-metrics-id-1";
const GROUP_METRICS_ID_2 = "group-metrics-id-2";
const GROUP_METRICS_ID_3 = "group-metrics-id-3";
const groupNameWithNoMetrics = "Group 3";
const GROUP_IDS = [GROUP_METRICS_ID_1, GROUP_METRICS_ID_2];
const ALLOCATION_NOTIFICATION_THRESHOLD_1 = 5;
const GROUP_ALLOCATION_NOTIFY_THRESHOLD_1: AllocationNotificationThreshold = {
  threshold: ALLOCATION_NOTIFICATION_THRESHOLD_1,
  inherited: true,
};
const SIMPLE_GROUP_1: SimpleGroup = {
  id: "group-id-1",
  name: "Group 1",
  projectId: PROJECT_ID,
  allocationNotificationThreshold: GROUP_ALLOCATION_NOTIFY_THRESHOLD_1,
};
const SIMPLE_GROUP_2: SimpleGroup = {
  id: "group-id-2",
  name: "Group 2",
  projectId: PROJECT_ID,
  allocationNotificationThreshold: GROUP_ALLOCATION_NOTIFY_THRESHOLD_1,
};
const SIMPLE_GROUP_3: SimpleGroup = {
  id: "group-id-3",
  name: "Group 3",
  projectId: PROJECT_ID,
  allocationNotificationThreshold: GROUP_ALLOCATION_NOTIFY_THRESHOLD_1,
};
const emptyPage: GroupMetricsPage = {
  content: [],
  size: 0,
  number: 0,
  totalPages: 0,
  totalElements: 0,
  last: true,
};
const groupMetrics1: GroupMetrics = {
  group: SIMPLE_GROUP_1,
  groupInfraFamilyMetrics: [
    {
      id: GROUP_METRICS_ID_1,
      remainingNumberOfAllocations: 2,
      lastSyncedOn: new Date(),
      allocationRequest: { infraFamily: { id: "f1", name: "Family 1" } },
    },
  ],
};

const groupMetrics2: GroupMetrics = {
  group: SIMPLE_GROUP_2,
  groupInfraFamilyMetrics: [
    {
      id: GROUP_METRICS_ID_2,
      remainingNumberOfAllocations: 3,
      lastSyncedOn: new Date(),
      allocationRequest: { infraFamily: { id: "f2", name: "Family 2" } },
    },
  ],
};

const groupMetricsWithUndefinedNumberOfAllocations: GroupMetrics = {
  group: SIMPLE_GROUP_3,
  groupInfraFamilyMetrics: [
    {
      id: GROUP_METRICS_ID_3,
      lastSyncedOn: new Date(),
      allocationRequest: { infraFamily: { id: "f3", name: "Family 3" } },
    },
  ],
};
const GROUP_METRICS_PAGE: GroupMetricsPage = {
  content: [groupMetrics1, groupMetrics2],
  size: 2,
  number: 0,
  totalPages: 1,
  totalElements: 2,
  last: true,
};

const projectInfraConfig = {
  groupAllocationNearCapacityThreshold: 10,
} as unknown as ProjectInfraConfig;
const stackedData: GroupedBarChartData = {
  data: [
    { groupName: "Group 1", threshold: 5, tooltips: {}, "Family 1": 2 },
    { groupName: "Group 2", threshold: 5, tooltips: {}, "Family 2": 3 },
  ],
  families: ["Family 1", "Family 2"],
};

describe("GroupMetricsBarChartStateService", () => {
  let service: GroupMetricsBarChartStateService;
  let groupsService: jest.Mocked<InfraGroupsService>;
  let projectInfraConfigService: jest.Mocked<ProjectInfraConfigService>;
  let barChartOptionsGenerator: jest.Mocked<GroupMetricsBarChartOptionsGenerator>;
  beforeEach(waitForAsync(() => {
    groupsService = {
      getGroupMetrics: jest.fn(() => of(GROUP_METRICS_PAGE)),
    } as unknown as jest.Mocked<InfraGroupsService>;
    barChartOptionsGenerator = {
      toGroupedData: jest.fn(() => stackedData),
    } as unknown as jest.Mocked<GroupMetricsBarChartOptionsGenerator>;
    projectInfraConfigService = {
      getProjectInfraConfig: jest.fn(() => of(projectInfraConfig)),
    } as unknown as jest.Mocked<ProjectInfraConfigService>;
    TestBed.configureTestingModule({
      providers: [
        GroupMetricsBarChartStateService,
        {
          provide: InfraGroupsService,
          useValue: groupsService,
        },
        {
          provide: GroupMetricsBarChartOptionsGenerator,
          useValue: barChartOptionsGenerator,
        },
        {
          provide: ProjectInfraConfigService,
          useValue: projectInfraConfigService,
        },
      ],
    });
    service = TestBed.inject(GroupMetricsBarChartStateService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("signals and observables initialization", () => {
    it("should emit distinct values from projectId observable", fakeAsync(() => {
      const emittedValues: string[] = [];
      service["projectId$"].subscribe((value) => emittedValues.push(value));

      setProjectIdSubject("first");
      tick(100);
      setProjectIdSubject("second");
      tick(100);
      setProjectIdSubject("third");
      tick(100);

      expect(emittedValues).toEqual(["first", "second", "third"]);
    }));

    it("should emit distinct values from groupIds observable", fakeAsync(() => {
      const emittedValues: string[][] = [];
      service["groupIds$"].subscribe((value) => emittedValues.push(value));

      setGroupIdsSubject(["first"]);
      tick(100);
      setGroupIdsSubject(["second"]);
      tick(100);
      setGroupIdsSubject(["third"]);
      tick(100);

      expect(emittedValues).toEqual([["first"], ["second"], ["third"]]);
    }));

    it("should set groupIds signal when subject changes", fakeAsync(() => {
      setGroupIdsSubject(GROUP_IDS);
      expect(service.groupIds()).toEqual(GROUP_IDS);
    }));

    it("should emit distinct values from groupNames observable", fakeAsync(() => {
      const emittedValues: string[][] = [];
      service["groupNames$"].subscribe((value) => emittedValues.push(value));

      setGroupNamesSubject(["first"]);
      tick(100);
      setGroupNamesSubject(["second"]);
      tick(100);
      setGroupNamesSubject(["third"]);
      tick(100);

      expect(emittedValues).toEqual([["first"], ["second"], ["third"]]);
    }));

    it("should set groupNames signal when subject changes", fakeAsync(() => {
      const groupNames = ["Group 1", "Group 2"];
      setGroupNamesSubject(groupNames);
      expect(service.groupNames()).toEqual(groupNames);
    }));

    it("should initialize isLoadingData signal to false", () => {
      expect(service.isLoadingData()).toBe(false);
    });
  });

  describe("group metrics page tests", () => {
    it("should get group metrics page when project id and group ids are set", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);

      expect(groupsService.getGroupMetrics).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        GROUP_IDS
      );
      expect(service.groupMetricsPage()).toEqual(GROUP_METRICS_PAGE);
    }));

    it("should get group metrics again when project id changes", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);

      expect(groupsService.getGroupMetrics).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        GROUP_IDS
      );
      expect(service.groupMetricsPage()).toEqual(GROUP_METRICS_PAGE);

      const newProjectId = "new-project-id";
      setProjectIdSubject(newProjectId);

      expect(groupsService.getGroupMetrics).toHaveBeenCalledWith(
        newProjectId,
        10,
        0,
        GROUP_IDS
      );
    }));

    it("should get group metrics again when group Ids changes", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);

      expect(groupsService.getGroupMetrics).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        GROUP_IDS
      );
      expect(service.groupMetricsPage()).toEqual(GROUP_METRICS_PAGE);

      const newGroupIds = ["new-group-id"];
      setGroupIdsSubject(newGroupIds);

      expect(groupsService.getGroupMetrics).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        newGroupIds
      );
    }));
    it("should propagate error message when getGroupMetrics fails and return empty page", fakeAsync(() => {
      const FAILURE_MESSAGE = "Failed to fetch group metrics";
      let receivedFailure: string | undefined = undefined;

      service["errorMessageSubject"].subscribe(
        (error) => (receivedFailure = error)
      );
      groupsService.getGroupMetrics.mockReturnValueOnce(
        throwError(() => new Error(FAILURE_MESSAGE))
      );
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);
      tick(100);

      expect(groupsService.getGroupMetrics).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        GROUP_IDS
      );
      expect(receivedFailure as unknown as string).toBe(FAILURE_MESSAGE);
      expect(service.groupMetricsPage()).toEqual(emptyPage);
    }));

    it("should still react to changes and get group metrics after failure", fakeAsync(() => {
      groupsService.getGroupMetrics.mockReturnValueOnce(
        throwError(() => new Error())
      );
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);
      tick(100);

      expect(groupsService.getGroupMetrics).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        GROUP_IDS
      );

      const newProjectId = "new-project-id";
      setProjectIdSubject(newProjectId);
      tick(100);
      expect(groupsService.getGroupMetrics).toHaveBeenCalledWith(
        newProjectId,
        10,
        0,
        GROUP_IDS
      );
    }));
  });

  describe("group metrics tests", () => {
    it("should compute group metrics signal from group metrics page", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);

      expect(service.groupMetrics()).toEqual(GROUP_METRICS_PAGE.content);
    }));

    it("should have group metrics signal as empty list by default", () => {
      expect(service.groupMetrics()).toEqual([]);
    });
  });
  describe("group names with no metrics tests", () => {
    it("should compute group names with no metrics when group metrics and group names change", fakeAsync(() => {
      setupForGroupMetricsWithNoNames();
      expect(service.groupNamesWithNoMetrics()).toEqual([
        groupNameWithNoMetrics,
      ]);
    }));

    it("should compute group names again when group metrics changes", fakeAsync(() => {
      setupForGroupMetricsWithNoNames();
      expect(service.groupNamesWithNoMetrics()).toEqual([
        groupNameWithNoMetrics,
      ]);

      const newGroupMetricsPage: GroupMetricsPage = {
        content: [groupMetrics1],
        size: 1,
        number: 0,
        totalPages: 1,
        totalElements: 1,
        last: true,
      };
      groupsService.getGroupMetrics.mockReturnValueOnce(
        of(newGroupMetricsPage)
      );
      setProjectIdSubject("new-project-id");
      tick(100);
      expect(service.groupMetrics()).toEqual([groupMetrics1]);
      expect(service.groupNamesWithNoMetrics()).toEqual([
        SIMPLE_GROUP_2.name,
        groupNameWithNoMetrics,
      ]);
    }));

    it("should compute group names with no metrics again when group names changes", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);
      tick(100);
      expect(service.groupMetrics()).toEqual(GROUP_METRICS_PAGE.content);
      setGroupNamesSubject([SIMPLE_GROUP_1.name, SIMPLE_GROUP_2.name]);
      tick(100);
      expect(service.groupNamesWithNoMetrics()).toEqual([]);

      setGroupNamesSubject([
        SIMPLE_GROUP_1.name,
        SIMPLE_GROUP_2.name,
        groupNameWithNoMetrics,
      ]);
      tick(100);
      expect(service.groupNamesWithNoMetrics()).toEqual([
        groupNameWithNoMetrics,
      ]);
    }));

    it("should include groups with undefined remainingNumberOfAllocations in group names with no metrics", fakeAsync(() => {
      const groupMetricsPageWithUndefinedAllocations: GroupMetricsPage = {
        content: [groupMetrics1, groupMetricsWithUndefinedNumberOfAllocations],
        size: 2,
        number: 0,
        totalPages: 1,
        totalElements: 2,
        last: true,
      };
      groupsService.getGroupMetrics.mockReturnValueOnce(
        of(groupMetricsPageWithUndefinedAllocations)
      );
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject([GROUP_METRICS_ID_1, GROUP_METRICS_ID_3]);
      tick(100);
      expect(service.groupMetrics()).toEqual(
        groupMetricsPageWithUndefinedAllocations.content
      );
      setGroupNamesSubject([SIMPLE_GROUP_1.name, SIMPLE_GROUP_3.name]);
      tick(100);
      expect(service.groupNamesWithNoMetrics()).toEqual([SIMPLE_GROUP_3.name]);
    }));

    it("should not include group in no-metrics when at least one family has defined allocations", fakeAsync(() => {
      const groupWithPartialMetrics: GroupMetrics = {
        group: SIMPLE_GROUP_3,
        groupInfraFamilyMetrics: [
          {
            id: GROUP_METRICS_ID_3,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f3", name: "Family 3" } },
          },
          {
            id: "other-id",
            remainingNumberOfAllocations: 5,
            lastSyncedOn: new Date(),
            allocationRequest: { infraFamily: { id: "f4", name: "Family 4" } },
          },
        ],
      };
      const page: GroupMetricsPage = {
        content: [groupMetrics1, groupWithPartialMetrics],
        size: 2,
        number: 0,
        totalPages: 1,
        totalElements: 2,
        last: true,
      };
      groupsService.getGroupMetrics.mockReturnValueOnce(of(page));
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject([GROUP_METRICS_ID_1, GROUP_METRICS_ID_3]);
      tick(100);
      setGroupNamesSubject([SIMPLE_GROUP_1.name, SIMPLE_GROUP_3.name]);
      tick(100);
      // Group 3 has one family with allocations, so it should NOT appear in no-metrics
      expect(service.groupNamesWithNoMetrics()).toEqual([]);
    }));
  });

  describe("stackedData tests", () => {
    it("should compute grouped bar data from group metrics with default threshold from config", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);
      tick(100);
      expect(service.groupMetrics()).toEqual(GROUP_METRICS_PAGE.content);
      expect(service.stackedData()).toEqual(stackedData);
      expect(
        projectInfraConfigService.getProjectInfraConfig
      ).toHaveBeenCalledWith(PROJECT_ID);
      expect(barChartOptionsGenerator.toGroupedData).toHaveBeenCalledWith(
        GROUP_METRICS_PAGE.content,
        projectInfraConfig.groupAllocationNearCapacityThreshold
      );
    }));
  });

  describe("shouldShowChart tests", () => {
    it("should set shouldShowChart to true when metrics exist and groups are selected", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);
      tick(100);
      expect(service.groupMetrics()).toEqual(GROUP_METRICS_PAGE.content);
      expect(service.shouldShowChart()).toBe(true);
    }));

    it("should set shouldShowChart to false when no metrics exist", fakeAsync(() => {
      groupsService.getGroupMetrics.mockReturnValueOnce(of(emptyPage));
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);
      tick(100);
      expect(service.groupMetrics()).toEqual([]);

      expect(service.groupMetrics()).toEqual([]);
      expect(service.shouldShowChart()).toBe(false);
    }));

    it("should set shouldShowChart to false when no groups are selected", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject([]);
      tick(100);
      expect(service.groupMetrics()).toEqual(GROUP_METRICS_PAGE.content);
      expect(service.shouldShowChart()).toBe(false);
    }));

    it("should set shouldShowChart to false when isLoadingData is true", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);
      tick(100);
      expect(service.groupMetrics()).toEqual(GROUP_METRICS_PAGE.content);
      expect(service.shouldShowChart()).toBe(true);
      service.isLoadingData.set(true);
      tick(100);
      expect(service.shouldShowChart()).toBe(false);
    }));
  });

  describe("shouldShowGroupNamesWithNoMetricsMessage tests", () => {
    it("should set shouldShowGroupNamesWithNoMetricsMessage to true when group names with no metrics exist", fakeAsync(() => {
      setupForGroupMetricsWithNoNames();
      expect(service.groupNamesWithNoMetrics()).toEqual([
        groupNameWithNoMetrics,
      ]);
      expect(service.shouldShowGroupNamesWithNoMetricsMessage()).toBe(true);
    }));

    it("should set shouldShowGroupNamesWithNoMetricsMessage to false when group names with no metrics don't exist", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      setGroupIdsSubject(GROUP_IDS);
      tick(100);
      expect(service.groupMetrics()).toEqual(GROUP_METRICS_PAGE.content);
      setGroupNamesSubject([SIMPLE_GROUP_1.name, SIMPLE_GROUP_2.name]);
      tick(100);
      expect(service.groupNamesWithNoMetrics()).toEqual([]);
      expect(service.shouldShowGroupNamesWithNoMetricsMessage()).toBe(false);
    }));

    it("should set shouldShowGroupNamesWithNoMetricsMessage to false when is loading is true", fakeAsync(() => {
      setupForGroupMetricsWithNoNames();
      expect(service.groupNamesWithNoMetrics()).toEqual([
        groupNameWithNoMetrics,
      ]);
      expect(service.shouldShowGroupNamesWithNoMetricsMessage()).toBe(true);
      service.isLoadingData.set(true);
      tick(100);
      expect(service.shouldShowGroupNamesWithNoMetricsMessage()).toBe(false);
    }));
  });

  function setProjectIdSubject(projectId: string) {
    service["projectIdSubject"].next(projectId);
  }

  function setGroupIdsSubject(groupIds: string[]) {
    service["groupIdsSubject"].next(groupIds);
  }

  function setGroupNamesSubject(groupNames: string[]) {
    service["groupNameSubject"].next(groupNames);
  }

  function setupForGroupMetricsWithNoNames() {
    setProjectIdSubject(PROJECT_ID);
    setGroupIdsSubject(GROUP_IDS);
    tick(100);
    expect(service.groupMetrics()).toEqual(GROUP_METRICS_PAGE.content);
    setGroupNamesSubject([
      SIMPLE_GROUP_1.name,
      SIMPLE_GROUP_2.name,
      groupNameWithNoMetrics,
    ]);
    tick(100);
  }
});
