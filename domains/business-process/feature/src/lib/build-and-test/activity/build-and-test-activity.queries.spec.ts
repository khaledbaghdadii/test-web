import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { BuildAndTestExecutionsService } from "@mxevolve/domains/business-process/data-access";
import type {
  ActivityRunsPage,
  ActivityRunsPageRequest,
} from "@mxevolve/domains/business-process/widget";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import {
  BT_ACTIVE_STATUSES,
  BT_HISTORY_STATUSES,
  buildAndTestLoadPage,
} from "./build-and-test-activity.queries";

describe("build-and-test-activity.queries", () => {
  const GATEWAY_URL = "https://api.test/";
  const PROJECT_ID = "project-1";
  const URL = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/ci-process`;

  let service: BuildAndTestExecutionsService;
  let httpTestingController: HttpTestingController;

  const baseRequest: ActivityRunsPageRequest = {
    page: 0,
    pageSize: 5,
    statuses: BT_ACTIVE_STATUSES,
    filters: {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        BuildAndTestExecutionsService,
      ],
    });
    service = TestBed.inject(BuildAndTestExecutionsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  function load(
    overrides: Partial<ActivityRunsPageRequest> = {}
  ): { rows: unknown[]; total: number } | undefined {
    let page: ActivityRunsPage<unknown> | undefined;
    buildAndTestLoadPage(
      service,
      PROJECT_ID
    )({
      ...baseRequest,
      ...overrides,
    }).subscribe((result) => (page = result));
    return page;
  }

  describe("status split", () => {
    it("treats running, pending-input and aborting runs as active", () => {
      expect(BT_ACTIVE_STATUSES).toEqual([
        ExecutionStatus.RUNNING,
        ExecutionStatus.PENDING_INPUT,
        ExecutionStatus.ABORTING,
      ]);
    });

    it("treats every other status as history with no overlap", () => {
      expect(BT_HISTORY_STATUSES).toEqual(
        expect.arrayContaining([
          ExecutionStatus.PASSED,
          ExecutionStatus.FAILED,
          ExecutionStatus.ABORTED,
          ExecutionStatus.STOPPED,
          ExecutionStatus.NOT_STARTED,
        ])
      );
      BT_ACTIVE_STATUSES.forEach((status) =>
        expect(BT_HISTORY_STATUSES).not.toContain(status)
      );
    });
  });

  it("sends the page, status split and owner filter with hidden=false", () => {
    load({
      page: 2,
      pageSize: 5,
      statuses: BT_ACTIVE_STATUSES,
      ownerPhrase: "john.doe",
    });

    const request = httpTestingController.expectOne((req) => req.url === URL);
    expect(request.request.params.get("page")).toBe("2");
    expect(request.request.params.get("pageSize")).toBe("5");
    expect(request.request.params.getAll("statuses")).toEqual([
      ExecutionStatus.RUNNING,
      ExecutionStatus.PENDING_INPUT,
      ExecutionStatus.ABORTING,
    ]);
    expect(request.request.params.get("ownerPhrase")).toBe("john.doe");
    expect(request.request.params.get("hidden")).toBe("false");
    request.flush({ totalElements: 0, content: [] });
  });

  it("preserves the text and multiselect column filters", () => {
    load({
      filters: {
        namePhrase: "nightly",
        userStoryIds: "VAL-1",
        configurationBranchNamePhrase: "feature/x",
        definitionIds: ["def-1", "def-2"],
      },
    });

    const request = httpTestingController.expectOne((req) => req.url === URL);
    expect(request.request.params.get("namePhrase")).toBe("nightly");
    expect(request.request.params.getAll("userStoryIds")).toEqual(["VAL-1"]);
    expect(request.request.params.get("configurationBranchNamePhrase")).toBe(
      "feature/x"
    );
    expect(request.request.params.getAll("definitionIds")).toEqual([
      "def-1",
      "def-2",
    ]);
    request.flush({ totalElements: 0, content: [] });
  });

  it("splits a date-range filter into start and end params", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-01-31T00:00:00.000Z");
    load({ filters: { startDateRange: [from, to] } });

    const request = httpTestingController.expectOne((req) => req.url === URL);
    expect(request.request.params.get("startDateRangeStart")).toBe(
      from.toISOString()
    );
    expect(request.request.params.get("startDateRangeEnd")).toBe(
      to.toISOString()
    );
    request.flush({ totalElements: 0, content: [] });
  });

  it("forwards the active status set and AG Grid sort param", () => {
    load({ statuses: BT_HISTORY_STATUSES, sort: "startDate,desc" });

    const request = httpTestingController.expectOne((req) => req.url === URL);
    expect(request.request.params.get("sort")).toBe("startDate,desc");
    expect(request.request.params.getAll("statuses")).toEqual(
      BT_HISTORY_STATUSES
    );
    request.flush({ totalElements: 0, content: [] });
  });

  it("narrows the status split with the Status column filter selection", () => {
    load({
      statuses: BT_HISTORY_STATUSES,
      filters: {
        statuses: [ExecutionStatus.PASSED, ExecutionStatus.RUNNING],
      },
    });

    const request = httpTestingController.expectOne((req) => req.url === URL);
    expect(request.request.params.getAll("statuses")).toEqual([
      ExecutionStatus.PASSED,
    ]);
    request.flush({ totalElements: 0, content: [] });
  });

  it("keeps the full status split when no Status column filter is selected", () => {
    load({ statuses: BT_ACTIVE_STATUSES, filters: { statuses: [] } });

    const request = httpTestingController.expectOne((req) => req.url === URL);
    expect(request.request.params.getAll("statuses")).toEqual(
      BT_ACTIVE_STATUSES
    );
    request.flush({ totalElements: 0, content: [] });
  });

  it("maps the backend result page onto the table rows and total", () => {
    let result: ActivityRunsPage<unknown> | undefined;
    buildAndTestLoadPage(
      service,
      PROJECT_ID
    )(baseRequest).subscribe((page) => (result = page));

    httpTestingController
      .expectOne((req) => req.url === URL)
      .flush({
        totalElements: 12,
        content: [
          {
            id: "exec-1",
            name: "Nightly build",
            status: "RUNNING",
            input: { userStoryIds: ["VAL-1"] },
          },
        ],
      });

    expect(result?.total).toBe(12);
    expect(result?.rows).toHaveLength(1);
  });
});
