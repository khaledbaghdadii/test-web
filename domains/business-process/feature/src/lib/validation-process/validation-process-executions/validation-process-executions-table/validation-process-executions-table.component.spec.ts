import { TestBed } from "@angular/core/testing";
import { SimpleChanges } from "@angular/core";
import { Table, TableLazyLoadEvent } from "primeng/table";
import { BusinessProcessDefinitionFilterResolverService } from "@mxflow/features/business-process";
import type {
  ValidationProcessExecution,
  ValidationProcessExecutionsQueryRequest,
} from "@mxevolve/domains/business-process/data-access";
import { ValidationProcessExecutionsTableComponent } from "./validation-process-executions-table.component";

const RESOLVED_DEFINITION_IDS = ["resolved-def-1"];

const mockDefinitionFilterResolverService = {
  resolveDefinitionIdsFrom: jest.fn(),
};

function createComponent(): ValidationProcessExecutionsTableComponent {
  TestBed.configureTestingModule({
    imports: [ValidationProcessExecutionsTableComponent],
  });
  TestBed.overrideComponent(ValidationProcessExecutionsTableComponent, {
    set: {
      template: "",
      imports: [],
      providers: [
        {
          provide: BusinessProcessDefinitionFilterResolverService,
          useValue: mockDefinitionFilterResolverService,
        },
      ],
    },
  });
  return TestBed.createComponent(ValidationProcessExecutionsTableComponent)
    .componentInstance;
}

function buildEvent(
  overrides: Partial<TableLazyLoadEvent> = {}
): TableLazyLoadEvent {
  return {
    first: 0,
    rows: 10,
    filters: {},
    ...overrides,
  };
}

describe("ValidationProcessExecutionsTableComponent", () => {
  let component: ValidationProcessExecutionsTableComponent;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDefinitionFilterResolverService.resolveDefinitionIdsFrom.mockReturnValue(
      RESOLVED_DEFINITION_IDS
    );
    component = createComponent();
  });

  it("starts with the default page size in the table query", () => {
    expect(component.validationProcessExecutionsTableQuery.pageSize).toBe(10);
  });

  it("starts on the first page in the table query", () => {
    expect(component.validationProcessExecutionsTableQuery.page).toBe(0);
  });

  describe("ngOnChanges", () => {
    function projectIdChange(
      previousValue: string | undefined,
      currentValue: string,
      firstChange: boolean
    ): SimpleChanges {
      return {
        projectId: {
          previousValue,
          currentValue,
          firstChange,
          isFirstChange: () => firstChange,
        },
      };
    }

    it("resets the table when the project changes", async () => {
      const reset = jest.fn();
      component.table = { reset } as unknown as Table;

      component.ngOnChanges(
        projectIdChange("old-project", "new-project", false)
      );
      await Promise.resolve();

      expect(reset).toHaveBeenCalled();
    });

    it("does not reset the table on the first change", async () => {
      const reset = jest.fn();
      component.table = { reset } as unknown as Table;

      component.ngOnChanges(projectIdChange(undefined, "new-project", true));
      await Promise.resolve();

      expect(reset).not.toHaveBeenCalled();
    });
  });

  describe("handleTableQueryParamsChange", () => {
    it("clears the current executions before reloading", () => {
      component.executions = [
        { id: "exec-1" } as unknown as ValidationProcessExecution,
      ];

      component.handleTableQueryParamsChange(buildEvent());

      expect(component.executions).toEqual([]);
    });

    it("emits a query when the table params change", () => {
      let emitted: ValidationProcessExecutionsQueryRequest | undefined;
      component.paginationParamsChangeEmitter.subscribe((q) => (emitted = q));

      component.handleTableQueryParamsChange(buildEvent());

      expect(emitted).toBeDefined();
    });
  });

  describe("setTableFilterParams", () => {
    it("applies an array filter value to the table query", () => {
      component.setTableFilterParams(
        buildEvent({
          filters: { namePhrase: [{ value: "alpha", matchMode: "contains" }] },
        })
      );

      expect(component.validationProcessExecutionsTableQuery.namePhrase).toBe(
        "alpha"
      );
    });

    it("applies a single object filter value to the table query", () => {
      component.setTableFilterParams(
        buildEvent({
          filters: { namePhrase: { value: "beta", matchMode: "contains" } },
        })
      );

      expect(component.validationProcessExecutionsTableQuery.namePhrase).toBe(
        "beta"
      );
    });

    it("removes a query property when the filter value is empty", () => {
      component.validationProcessExecutionsTableQuery.namePhrase = "stale";

      component.setTableFilterParams(
        buildEvent({
          filters: { namePhrase: [{ value: null, matchMode: "contains" }] },
        })
      );

      expect(
        component.validationProcessExecutionsTableQuery.namePhrase
      ).toBeUndefined();
    });
  });

  describe("setPaginationParams", () => {
    it("updates the page size in the table query", () => {
      component.setPaginationParams(2, 25);

      expect(component.validationProcessExecutionsTableQuery.pageSize).toBe(25);
    });

    it("sets the page index when it differs from the current page", () => {
      component.setPaginationParams(3, 10);

      expect(component.validationProcessExecutionsTableQuery.page).toBe(3);
    });

    it("resets to the first page when the page index is unchanged", () => {
      component.validationProcessExecutionsTableQuery.page = 5;

      component.setPaginationParams(5, 10);

      expect(component.validationProcessExecutionsTableQuery.page).toBe(0);
    });
  });

  describe("setSortOrder", () => {
    it("sorts by expiry date ascending", () => {
      component.setSortOrder(
        buildEvent({ sortField: "sortByExpiryDate", sortOrder: 1 })
      );

      expect(
        component.validationProcessExecutionsTableQuery.sortByExpiryDate
      ).toBe("ascending");
    });

    it("sorts by expiry date descending", () => {
      component.setSortOrder(
        buildEvent({ sortField: "sortByExpiryDate", sortOrder: -1 })
      );

      expect(
        component.validationProcessExecutionsTableQuery.sortByExpiryDate
      ).toBe("descending");
    });

    it("sorts by start date ascending", () => {
      component.setSortOrder(
        buildEvent({ sortField: "sortByStartDate", sortOrder: 1 })
      );

      expect(
        component.validationProcessExecutionsTableQuery.sortByStartDate
      ).toBe("ascending");
    });

    it("sorts by days extended descending", () => {
      component.setSortOrder(
        buildEvent({ sortField: "sortByDaysExtended", sortOrder: -1 })
      );

      expect(
        component.validationProcessExecutionsTableQuery.sortByDaysExtended
      ).toBe("descending");
    });

    it("clears other sort fields when sorting by start date", () => {
      component.validationProcessExecutionsTableQuery.sortByExpiryDate =
        "ascending";

      component.setSortOrder(
        buildEvent({ sortField: "sortByStartDate", sortOrder: 1 })
      );

      expect(
        component.validationProcessExecutionsTableQuery.sortByExpiryDate
      ).toBeUndefined();
    });
  });

  describe("emitted query (mapToDomain)", () => {
    function emitWith(
      query: Partial<
        ValidationProcessExecutionsTableComponent["validationProcessExecutionsTableQuery"]
      >
    ): ValidationProcessExecutionsQueryRequest {
      component.validationProcessExecutionsTableQuery = {
        page: 0,
        pageSize: 10,
        ...query,
      };
      let emitted!: ValidationProcessExecutionsQueryRequest;
      component.paginationParamsChangeEmitter.subscribe((q) => (emitted = q));
      component.handleTableQueryParamsChange(buildEvent());
      return emitted;
    }

    it("resolves definition ids through the resolver service", () => {
      const emitted = emitWith({ definitionIds: ["def-1"] });

      expect(emitted.definitionIds).toEqual(RESOLVED_DEFINITION_IDS);
    });

    it("maps a start date range into start and end bounds", () => {
      const emitted = emitWith({
        startDateRange: ["2024-01-01", "2024-01-31"],
      });

      expect(emitted.startDateRangeStart).toBe("2024-01-01");
    });

    it("maps an end date range into start and end bounds", () => {
      const emitted = emitWith({
        endDateRange: ["2024-02-01", "2024-02-28"],
      });

      expect(emitted.endDateRangeEnd).toBe("2024-02-28");
    });

    it("maps an expiry date range into start and end bounds", () => {
      const emitted = emitWith({
        expiryDateRange: ["2024-03-01", "2024-03-31"],
      });

      expect(emitted.expiryDateRangeStart).toBe("2024-03-01");
    });

    it("removes empty array properties from the emitted query", () => {
      mockDefinitionFilterResolverService.resolveDefinitionIdsFrom.mockReturnValue(
        []
      );

      const emitted = emitWith({ definitionIds: [] });

      expect("definitionIds" in emitted).toBe(false);
    });

    it("always sends hidden as false", () => {
      const emitted = emitWith({});

      expect(emitted.hidden).toBe(false);
    });

    it("emits no sort when no sort field is selected", () => {
      const emitted = emitWith({});

      expect(emitted.sort).toBeUndefined();
    });

    it("emits startDate ascending sort", () => {
      const emitted = emitWith({ sortByStartDate: "ascending" });

      expect(emitted.sort).toBe("startDate,asc");
    });

    it("emits startDate descending sort", () => {
      const emitted = emitWith({ sortByStartDate: "descending" });

      expect(emitted.sort).toBe("startDate,desc");
    });

    it("emits expiryDate ascending sort", () => {
      const emitted = emitWith({ sortByExpiryDate: "ascending" });

      expect(emitted.sort).toBe("expiryDate,asc");
    });

    it("emits expiryDate descending sort", () => {
      const emitted = emitWith({ sortByExpiryDate: "descending" });

      expect(emitted.sort).toBe("expiryDate,desc");
    });

    it("emits daysExtended ascending sort", () => {
      const emitted = emitWith({ sortByDaysExtended: "ascending" });

      expect(emitted.sort).toBe("daysExtended,asc");
    });

    it("emits daysExtended descending sort", () => {
      const emitted = emitWith({ sortByDaysExtended: "descending" });

      expect(emitted.sort).toBe("daysExtended,desc");
    });
  });
});
