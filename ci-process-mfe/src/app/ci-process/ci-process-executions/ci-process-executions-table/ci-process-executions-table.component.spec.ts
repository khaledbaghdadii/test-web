import { CiProcessExecutionsTableComponent } from "./ci-process-executions-table.component";
import { CiProcessExecutionsQuery } from "../models/ci-process-execution-query";
import { TableLazyLoadEvent } from "primeng/table";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionFilterResolverService,
} from "@mxflow/features/business-process";
import { CiProcessExecutionsTableQuery } from "./ci-process-executions-table-query";
import { MockBuilder, MockRender, ngMocks } from "ng-mocks";
import {
  IssueTrackingService,
  JiraDetailsResponse,
} from "@mxflow/features/project";
import { of } from "rxjs";

describe("Component: CiProcessExecutionsTableComponent", () => {
  let component: CiProcessExecutionsTableComponent;
  let definitionFilterResolverService: BusinessProcessDefinitionFilterResolverService;

  beforeEach(() => {
    return MockBuilder(CiProcessExecutionsTableComponent)
      .mock(BusinessProcessDefinitionFilterResolverService, {
        resolveDefinitionIdsFrom: jest.fn(() => undefined),
      })
      .mock(IssueTrackingService);
  });

  beforeEach(() => {
    const issueTrackingService = ngMocks.findInstance(IssueTrackingService);
    jest
      .spyOn(issueTrackingService, "getJiraDetails")
      .mockReturnValue(of({} as JiraDetailsResponse));

    const fixture = MockRender(CiProcessExecutionsTableComponent);
    component = fixture.point.componentInstance;
    definitionFilterResolverService = ngMocks.findInstance(
      BusinessProcessDefinitionFilterResolverService
    );

    component.ciProcessExecutionsQuery = {
      pageSize: 10,
      page: 3,
    };

    jest.spyOn(component.paginationParamsChangeEmitter, "emit");
  });

  it("should resolve jira base url to display user stories correctly", () => {
    const issueTrackingService = ngMocks.findInstance(IssueTrackingService);
    const mockJiraDetails = {
      jiraBaseUrl: "https://jira.example.com",
    } as JiraDetailsResponse;
    jest
      .spyOn(issueTrackingService, "getJiraDetails")
      .mockReturnValue(of(mockJiraDetails));

    component.projectId = "test-project-123";
    component.ngOnInit();

    component.jiraBaseUrl$.subscribe((jiraDetails) => {
      expect(jiraDetails).toEqual(mockJiraDetails);
    });
  });

  it("should sort ascending and emit event when handling Table Query Params Change", () => {
    const nzTableQueryParams: TableLazyLoadEvent = {
      first: 0,
      rows: 5,
      sortField: "sortByStartDate",
      sortOrder: 1,
    };
    jest.spyOn(component.paginationParamsChangeEmitter, "emit");

    component.handleTableQueryParamsChange(nzTableQueryParams);

    const expectedQuery: CiProcessExecutionsQuery = {
      page: 0,
      pageSize: 5,
      sort: "startDate,asc",
      hidden: false,
    };
    expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
      expectedQuery
    );
  });

  it("should sort descending and emit event when handling Table Query Params Change", () => {
    const nzTableQueryParams: TableLazyLoadEvent = {
      first: 0,
      rows: 5,
      sortOrder: -1,
      sortField: "sortByStartDate",
      filters: {},
    };
    jest.spyOn(component.paginationParamsChangeEmitter, "emit");

    component.handleTableQueryParamsChange(nzTableQueryParams);

    const expectedQuery: CiProcessExecutionsQuery = {
      page: 0,
      pageSize: 5,
      sort: "startDate,desc",
      hidden: false,
    };
    expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
      expectedQuery
    );
  });

  it("should remove sort by expiry date when user sorts by start date desending", () => {
    const event: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
      sortOrder: 1,
      sortField: "sortByStartDate",
    };
    component.handleTableQueryParamsChange(event);
    expect(component.ciProcessExecutionsQuery.sortByExpiryDate).toBeFalsy();
  });

  it("should remove sort by expiry date when user sorts by start date ascending", () => {
    const event: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
      sortOrder: 0,
      sortField: "sortByStartDate",
    };
    component.handleTableQueryParamsChange(event);
    expect(component.ciProcessExecutionsQuery.sortByExpiryDate).toBeFalsy();
  });

  it("should remove sort by start date when user sorts by expiry date desending", () => {
    const event: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
      sortOrder: 1,
      sortField: "sortByExpiryDate",
    };
    component.handleTableQueryParamsChange(event);
    expect(component.ciProcessExecutionsQuery.sortByStartDate).toBeFalsy();
  });

  it("should remove sort by start date when user sorts by expiry date ascending", () => {
    const event: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
      sortOrder: 0,
      sortField: "sortByExpiryDate",
    };
    component.handleTableQueryParamsChange(event);
    expect(component.ciProcessExecutionsQuery.sortByStartDate).toBeFalsy();
  });

  it("should sort by expiry date ascending when sort field is sortByExpiryDate and sort order is 1", () => {
    const event: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
      sortOrder: 1,
      sortField: "sortByExpiryDate",
    };
    component.handleTableQueryParamsChange(event);
    expect(component.ciProcessExecutionsQuery.sortByExpiryDate).toEqual(
      "ascending"
    );
  });

  it("should sort by expiry date descending when sort field is sortByExpiryDate and sort order is different than 1", () => {
    const event: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
      sortOrder: 0,
      sortField: "sortByExpiryDate",
    };
    component.handleTableQueryParamsChange(event);
    expect(component.ciProcessExecutionsQuery.sortByExpiryDate).toEqual(
      "descending"
    );
  });

  it.each([
    {
      description: "longest extension periods first (desc)",
      sortField: "sortByDaysExtended",
      sortOrder: -1,
      expectedSort: "daysExtended,desc",
    },
    {
      description: "shortest extension periods first (asc)",
      sortField: "sortByDaysExtended",
      sortOrder: 1,
      expectedSort: "daysExtended,asc",
    },
    {
      description: "newest start date first (desc)",
      sortField: "sortByStartDate",
      sortOrder: -1,
      expectedSort: "startDate,desc",
    },
    {
      description: "oldest start date first (asc)",
      sortField: "sortByStartDate",
      sortOrder: 1,
      expectedSort: "startDate,asc",
    },
    {
      description: "newest expiry date first (desc)",
      sortField: "sortByExpiryDate",
      sortOrder: -1,
      expectedSort: "expiryDate,desc",
    },
    {
      description: "oldest expiry date first (asc)",
      sortField: "sortByExpiryDate",
      sortOrder: 1,
      expectedSort: "expiryDate,asc",
    },
  ])(
    "When the user requests to view the build and test executions with $description, then we should filter the executions table by $expectedSort in the correct order",
    ({ sortOrder, sortField, expectedSort }) => {
      const event = createLazyLoadEvent(sortField, sortOrder);

      component.handleTableQueryParamsChange(event);

      const expectedQuery = {
        page: 0,
        pageSize: 10,
        sort: expectedSort,
        hidden: false,
      };

      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    }
  );

  it("should filter on definition id emit event when handling Table Query Params Change", () => {
    jest
      .spyOn(definitionFilterResolverService, "resolveDefinitionIdsFrom")
      .mockImplementation(
        (
          definitions,
          definitionIds: string[] | undefined,
          processNames: string[] | undefined
        ) => {
          if (
            definitionIds?.includes("ID_1") &&
            definitionIds.length === 1 &&
            processNames?.includes("process1") &&
            processNames.length === 1
          ) {
            return ["ID_1", "ID_2"];
          }
          return [];
        }
      );

    component.ciProcessExecutionsQuery = {
      pageSize: 10,
      page: 3,
    };
    const tableLazyLoadEvent: TableLazyLoadEvent = {
      first: 1,
      rows: 5,
      filters: {
        definitionIds: [
          {
            matchMode: "contains",
            value: ["ID_1"],
          },
        ],
        processNames: [
          {
            matchMode: "contains",
            value: ["process1"],
          },
        ],
      },
    };
    jest.spyOn(component.paginationParamsChangeEmitter, "emit");

    component.handleTableQueryParamsChange(tableLazyLoadEvent);

    const expectedQuery: any = {
      page: 0,
      pageSize: 5,
      definitionIds: ["ID_1", "ID_2"],
      hidden: false,
    };
    expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
      expectedQuery
    );
  });

  it("should filter on statuses emit event when handling Table Query Params Change", () => {
    const nzTableQueryParams: TableLazyLoadEvent = {
      first: 0,
      rows: 5,
      filters: {
        statuses: {
          value: ["PASSED", "FAILED"],
        },
      },
    };
    jest.spyOn(component.paginationParamsChangeEmitter, "emit");

    component.handleTableQueryParamsChange(nzTableQueryParams);

    const expectedQuery: CiProcessExecutionsQuery = {
      page: 0,
      pageSize: 5,
      statuses: ["PASSED", "FAILED"],
      hidden: false,
    };
    expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
      expectedQuery
    );
  });

  it("should emit an event when the user filters on definitions", function () {
    component.ciProcessExecutionsQuery = {
      page: 0,
      pageSize: 10,
      definitionIds: ["id1"],
      processNames: ["name1"],
    } as unknown as CiProcessExecutionsTableQuery;
    let businessProcessDefinitions = [
      {
        processName: "process 1",
      } as unknown as BusinessProcessDefinition,
    ];
    definitionFilterResolverService.resolveDefinitionIdsFrom = jest.fn(() => [
      "resolvedId",
    ]);
    component.businessProcessDefinitions = businessProcessDefinitions;
    jest.spyOn(component.paginationParamsChangeEmitter, "emit");

    component.handleTableQueryParamsChange({
      first: 1,
      rows: 10,
    });

    expect(
      definitionFilterResolverService.resolveDefinitionIdsFrom
    ).toHaveBeenCalledWith(businessProcessDefinitions, ["id1"], ["name1"]);

    const expectedOutput: CiProcessExecutionsQuery = {
      page: 0,
      pageSize: 10,
      definitionIds: ["resolvedId"],
      hidden: false,
    };

    expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
      expectedOutput
    );
  });

  describe("filter by start date range", () => {
    it("should pass undefined as start date range start when it is not set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          startDateRange: [
            {
              matchMode: "contains",
              value: undefined,
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        startDateRangeStart: undefined,
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass start date range start when it is set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          startDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        startDateRangeStart: "2023-01-01",
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass start date range end as undefined when it is not set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          startDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        startDateRangeStart: expect.any(String),
        startDateRangeEnd: undefined,
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass start date range end when it is set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          startDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01", "2023-02-02"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        startDateRangeStart: expect.any(String),
        startDateRangeEnd: "2023-02-02",
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
  });

  describe("filter by end date range", () => {
    it("should pass undefined as end date range end when it is not set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          endDateRange: [
            {
              matchMode: "contains",
              value: undefined,
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        endDateRangeStart: undefined,
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass end date range end when it is set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          endDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        endDateRangeStart: "2023-01-01",
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass end date range end as undefined when it is not set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          endDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        endDateRangeStart: expect.any(String),
        endDateRangeEnd: undefined,
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass end date range end when it is set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          endDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01", "2023-02-02"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        endDateRangeStart: expect.any(String),
        endDateRangeEnd: "2023-02-02",
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
  });

  describe("filter by expiry date range", () => {
    it("should pass undefined as expiry date range expiry when it is not set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          expiryDateRange: [
            {
              matchMode: "contains",
              value: undefined,
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        expiryDateRangeStart: undefined,
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass expiry date range expiry when it is set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          expiryDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        expiryDateRangeStart: "2023-01-01",
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass expiry date range expiry as undefined when it is not set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          expiryDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        expiryDateRangeStart: expect.any(String),
        expiryDateRangeEnd: undefined,
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
    it("should pass expiry date range expiry when it is set", () => {
      const tableLazyLoadEvent: TableLazyLoadEvent = {
        first: 0,
        rows: 5,
        filters: {
          expiryDateRange: [
            {
              matchMode: "contains",
              value: ["2023-01-01", "2023-02-02"],
            },
          ],
        },
      };
      jest.spyOn(component.paginationParamsChangeEmitter, "emit");

      component.handleTableQueryParamsChange(tableLazyLoadEvent);

      const expectedQuery: CiProcessExecutionsQuery = {
        page: expect.any(Number),
        pageSize: expect.any(Number),
        expiryDateRangeStart: expect.any(String),
        expiryDateRangeEnd: "2023-02-02",
        hidden: false,
      };
      expect(component.paginationParamsChangeEmitter.emit).toHaveBeenCalledWith(
        expectedQuery
      );
    });
  });
});

function createLazyLoadEvent(sortField: string, sortOrder: number) {
  const event: TableLazyLoadEvent = {
    first: 0,
    rows: 10,
    sortOrder: sortOrder,
    sortField: sortField,
  };
  return event;
}
