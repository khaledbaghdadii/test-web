import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { WorkItemService } from "./work-item.service";
import { APP_CONFIG } from "@mxflow/config";
import {
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType,
} from "../../model/work-item";
import { WorkItemsPerStatusApiResponse } from "./response/work-items-per-status-api-response.model";
import { WorkItemFilterApiRequest } from "./request/work-item-filter-api-request.model";
import { WorkItemAssignableUsersApiResponse } from "./response/work-item-assignable-users-api-response.model";
import { firstValueFrom } from "rxjs";
import { WorkItemPageApiResponse } from "./response/work-item-page-api-response.model";

describe("WorkItemService", () => {
  let service: WorkItemService;
  let httpMock: HttpTestingController;

  const mockConfig = {
    gatewayUrl: "https://api-gateway/",
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkItemService,
        { provide: APP_CONFIG, useValue: mockConfig },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(WorkItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("service initialization", () => {
    it("should create service instance", () => {
      expect(service).toBeTruthy();
    });

    it("should configure API URL from config", () => {
      expect(service.apiUrl).toBe("https://api-gateway/");
    });
  });

  describe("getWorkItemsPerStatus", () => {
    const mockResponse: WorkItemsPerStatusApiResponse = {
      [WorkItemStatus.OPEN]: {
        content: [
          {
            id: "1",
            projectId: "project-1",
            name: "Work Item 1",
            description: "Test work item",
            workItemCategory: "development",
            domain: "web",
            workItemType: WorkItemType.AGGREGATE,
            workItemStatus: WorkItemStatus.OPEN,
            workItemPriority: WorkItemPriority.HIGH,
            metadata: {},
            projectName: "projectName",
            businessProcesses: [{ id: "bp-1" }],
            dueDate: new Date("2023-12-31"),
            createdOn: new Date("2023-01-01"),
          },
        ],
        totalElements: 1,
        totalPages: 1,
        last: true,
        first: true,
        size: 20,
        number: 0,
        numberOfElements: 1,
        empty: false,
      },
    };

    it("should fetch work items per status with default parameters", () => {
      service
        .getWorkItemsPerStatus({ workItemStatuses: [WorkItemStatus.OPEN] })
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/bulk?page=0&size=20&sort=createdOn,desc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({
        workItemStatuses: [WorkItemStatus.OPEN],
      });
      req.flush(mockResponse);
    });

    it("should handle all filter parameters and multiple statuses", async () => {
      const filterParams = {
        search: "test search",
        workItemPriority: WorkItemPriority.HIGH,
        workItemType: WorkItemType.AGGREGATE,
        projectIds: ["project-1", "project-2", "project-3"],
        assignees: ["john", "doe"],
        dueDateFrom: "2023-01-01",
        dueDateTo: "2023-12-31",
        resolvedDateSince: "2023-06-01",
        workItemCategories: ["development", "testing", "documentation"],
        workItemStatuses: [WorkItemStatus.OPEN, WorkItemStatus.UNDERWAY],
      };

      const promise = firstValueFrom(
        service.getWorkItemsPerStatus(filterParams, 0, 10)
      );

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/bulk?page=0&size=10&sort=createdOn,desc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(filterParams);
      req.flush(mockResponse);

      const response = await promise;
      expect(response).toEqual(mockResponse);
    });

    it("should handle empty projectIds and statuses arrays", async () => {
      const filterParams = { projectIds: [], workItemStatuses: [] };

      const promise = firstValueFrom(
        service.getWorkItemsPerStatus(filterParams)
      );

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/bulk?page=0&size=20&sort=createdOn,desc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(filterParams);
      req.flush(mockResponse);

      const response = await promise;
      expect(response).toEqual(mockResponse);
    });

    it("should handle empty filter object", () => {
      service
        .getWorkItemsPerStatus({ workItemStatuses: [WorkItemStatus.OPEN] })
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });
      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/bulk?page=0&size=20&sort=createdOn,desc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({
        workItemStatuses: [WorkItemStatus.OPEN],
      });
      req.flush(mockResponse);
    });

    it("should handle undefined filter parameter", () => {
      service
        .getWorkItemsPerStatus({ workItemStatuses: [WorkItemStatus.OPEN] })
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });
      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/bulk?page=0&size=20&sort=createdOn,desc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({
        workItemStatuses: [WorkItemStatus.OPEN],
      });
      req.flush(mockResponse);
    });

    it("should handle server errors", async () => {
      const mockError = { status: 500, statusText: "Server Error" };
      const promise = firstValueFrom(
        service.getWorkItemsPerStatus({
          workItemStatuses: [WorkItemStatus.OPEN],
        })
      );
      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/bulk?page=0&size=20&sort=createdOn,desc"
      );
      req.flush("Server error", mockError);
      expect(req.request.body).toEqual({
        workItemStatuses: [WorkItemStatus.OPEN],
      });
      await expect(promise).rejects.toMatchObject({ status: 500 });
    });

    it("should handle not found errors", async () => {
      const mockError = { status: 404, statusText: "Not Found" };
      const promise = firstValueFrom(
        service.getWorkItemsPerStatus({
          workItemStatuses: [WorkItemStatus.OPEN],
        })
      );
      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/bulk?page=0&size=20&sort=createdOn,desc"
      );
      req.flush("Not found", mockError);
      expect(req.request.body).toEqual({
        workItemStatuses: [WorkItemStatus.OPEN],
      });
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("getWorkItemCategories", () => {
    const mockCategoriesResponse: string[] = [
      "development",
      "testing",
      "documentation",
      "bug-fix",
    ];

    it("should fetch work item categories without project filter", () => {
      service.getWorkItemCategories().subscribe((response) => {
        expect(response).toEqual(mockCategoriesResponse);
      });

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/categories"
      );
      expect(req.request.method).toBe("GET");
      expect(req.request.params.has("projectIds")).toBe(false);
      req.flush(mockCategoriesResponse);
    });

    it("should fetch work item categories with project filter", async () => {
      const projectIds = ["project-1", "project-2"];
      const expectedUrl =
        "https://api-gateway/work-item-management/work-items/categories?" +
        "projectIds=project-1&projectIds=project-2";

      const promise = firstValueFrom(service.getWorkItemCategories(projectIds));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockCategoriesResponse);

      const response = await promise;
      expect(response).toEqual(mockCategoriesResponse);
    });

    it("should handle empty projectIds array correctly", async () => {
      const projectIds: string[] = [];

      const promise = firstValueFrom(service.getWorkItemCategories(projectIds));

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/categories"
      );
      expect(req.request.method).toBe("GET");
      expect(req.request.params.has("projectIds")).toBe(false);
      req.flush(mockCategoriesResponse);

      const response = await promise;
      expect(response).toEqual(mockCategoriesResponse);
    });

    it("should handle single project ID correctly", async () => {
      const projectIds = ["project-1"];
      const expectedUrl =
        "https://api-gateway/work-item-management/work-items/categories?" +
        "projectIds=project-1";

      const promise = firstValueFrom(service.getWorkItemCategories(projectIds));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockCategoriesResponse);

      const response = await promise;
      expect(response).toEqual(mockCategoriesResponse);
    });

    it("should handle server errors", async () => {
      const mockError = { status: 500, statusText: "Server Error" };

      const promise = firstValueFrom(service.getWorkItemCategories());

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/categories"
      );
      req.flush("Server error", mockError);

      await expect(promise).rejects.toMatchObject({ status: 500 });
    });

    it("should handle not found errors", async () => {
      const mockError = { status: 404, statusText: "Not Found" };

      const promise = firstValueFrom(
        service.getWorkItemCategories(["project-1"])
      );

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items/categories?projectIds=project-1"
      );
      req.flush("Not found", mockError);

      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("getWorkItemAssignableUsers", () => {
    const mockAssignableUsersResponse: WorkItemAssignableUsersApiResponse = {
      content: [
        {
          id: "user1-id",
          displayName: "User 1",
          mail: "user1@example.com",
        },
        {
          id: "user2-id",
          displayName: "User 2",
          mail: "user2@example.com",
        },
      ],
      last: true,
    };

    it("should fetch assignable users with default parameters", async () => {
      const projectId = "project-1";
      const workItemId = "work-item-1";
      const expectedUrl =
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/assignable-users?" +
        "page=0&size=25";

      const promise = firstValueFrom(
        service.getWorkItemAssignableUsers(projectId, workItemId)
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockAssignableUsersResponse);

      const response = await promise;
      expect(response).toEqual(mockAssignableUsersResponse);
    });

    it("should fetch assignable users with search key", async () => {
      const projectId = "project-1";
      const workItemId = "work-item-1";
      const searchKey = "john";
      const expectedUrl =
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/assignable-users?" +
        "page=0&size=25&searchKey=john";

      const promise = firstValueFrom(
        service.getWorkItemAssignableUsers(
          projectId,
          workItemId,
          0,
          25,
          searchKey
        )
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockAssignableUsersResponse);

      const response = await promise;
      expect(response).toEqual(mockAssignableUsersResponse);
    });

    it("should fetch assignable users with custom page and size", async () => {
      const projectId = "project-1";
      const workItemId = "work-item-1";
      const expectedUrl =
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/assignable-users?" +
        "page=2&size=50";

      const promise = firstValueFrom(
        service.getWorkItemAssignableUsers(projectId, workItemId, 2, 50)
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      req.flush(mockAssignableUsersResponse);

      const response = await promise;
      expect(response).toEqual(mockAssignableUsersResponse);
    });

    it("should not include searchKey param when undefined", async () => {
      const projectId = "project-1";
      const workItemId = "work-item-1";
      const expectedUrl =
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/assignable-users?" +
        "page=0&size=25";

      const promise = firstValueFrom(
        service.getWorkItemAssignableUsers(projectId, workItemId, 0, 25)
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.has("searchKey")).toBe(false);
      req.flush(mockAssignableUsersResponse);

      const response = await promise;
      expect(response).toEqual(mockAssignableUsersResponse);
    });

    it("should handle errors", async () => {
      const mockError = { status: 500, statusText: "Server Error" };
      const promise = firstValueFrom(
        service.getWorkItemAssignableUsers("project-1", "work-item-1")
      );

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/assignable-users?page=0&size=25"
      );
      req.flush("Server error", mockError);

      await expect(promise).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("updateWorkItemAssignee", () => {
    const mockUpdatedWorkItem: WorkItem = {
      id: "work-item-1",
      projectId: "project-1",
      name: "Updated Work Item",
      description: "Test work item",
      workItemCategory: "development",
      projectName: "projectName",
      domain: "web",
      workItemType: WorkItemType.AGGREGATE,
      workItemStatus: WorkItemStatus.OPEN,
      workItemPriority: WorkItemPriority.HIGH,
      metadata: {},
      businessProcesses: [{ id: "bp-1" }],
      assignee: "john@example.com",
      dueDate: new Date("2023-12-31"),
      createdOn: new Date("2023-01-01"),
    };

    it("should update work item assignee with provided email", async () => {
      const projectId = "project-1";
      const workItemId = "work-item-1";
      const assignee = "john@example.com";
      const expectedUrl =
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/assignee";

      const promise = firstValueFrom(
        service.updateWorkItemAssignee(projectId, workItemId, assignee)
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("PATCH");
      expect(req.request.body).toEqual({ assignee: "john@example.com" });
      req.flush(mockUpdatedWorkItem);

      const response = await promise;
      expect(response).toEqual(mockUpdatedWorkItem);
    });

    it("should update work item assignee with null when assignee is undefined", async () => {
      const projectId = "project-1";
      const workItemId = "work-item-1";
      const expectedUrl =
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/assignee";

      const promise = firstValueFrom(
        service.updateWorkItemAssignee(projectId, workItemId)
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("PATCH");
      expect(req.request.body).toEqual({ assignee: null });
      req.flush({ ...mockUpdatedWorkItem, assignee: undefined });

      const response = await promise;
      expect(response.assignee).toBeUndefined();
    });

    it("should handle errors", async () => {
      const mockError = { status: 500, statusText: "Server Error" };
      const promise = firstValueFrom(
        service.updateWorkItemAssignee(
          "project-1",
          "work-item-1",
          "john@example.com"
        )
      );

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/assignee"
      );
      req.flush("Server error", mockError);

      await expect(promise).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("updateDueDate", () => {
    const projectId = "project-1";
    const workItemId = "work-item-1";
    const mockResponse: WorkItem = {
      id: "1",
      projectId: "project-1",
      name: "Work Item 1",
      description: "Test work item",
      workItemCategory: "development",
      projectName: "projectName",
      domain: "web",
      workItemType: WorkItemType.AGGREGATE,
      workItemStatus: WorkItemStatus.OPEN,
      workItemPriority: WorkItemPriority.HIGH,
      metadata: {},
      businessProcesses: [{ id: "bp-1" }],
      dueDate: new Date("2023-12-31"),
      createdOn: new Date("2023-01-01"),
    };

    const selectedDate = new Date(2025, 10, 6);

    it("should send PATCH request with due date set to end of day", async () => {
      const expectedUrl =
        "https://api-gateway/work-item-management/projects/project-1/work-items/work-item-1/dueDate";

      const adjustedDate = new Date(selectedDate);
      adjustedDate.setHours(23, 59, 59, 999);

      const promise = firstValueFrom(
        service.updateDueDate(projectId, workItemId, adjustedDate)
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("PATCH");
      expect(req.request.body.dueDate).toBe(adjustedDate.toISOString());

      req.flush(mockResponse);
      const response = await promise;
      expect(response).toEqual(mockResponse);
    });

    it("should handle server errors", async () => {
      const mockError = { status: 500, statusText: "Internal Server Error" };

      const promise = firstValueFrom(
        service.updateDueDate(projectId, workItemId, selectedDate)
      );

      const req = httpMock.expectOne((request) =>
        request.url.includes("dueDate")
      );
      req.flush("Server error", mockError);

      await expect(promise).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("getFilteredWorkItems", () => {
    const mockPageResponse: WorkItemPageApiResponse = {
      content: [
        {
          id: "2",
          projectId: "project-2",
          name: "Work Item 2",
          description: "Filtered work item",
          workItemCategory: "testing",
          domain: "web",
          projectName: "projectName",
          workItemType: WorkItemType.AGGREGATE,
          workItemStatus: WorkItemStatus.UNDERWAY,
          workItemPriority: WorkItemPriority.MEDIUM,
          metadata: {},
          businessProcesses: [{ id: "bp-2" }],
          dueDate: new Date("2023-11-30"),
          createdOn: new Date("2023-02-01"),
        },
      ],
      totalElements: 1,
      totalPages: 1,
      last: true,
      first: true,
      size: 20,
      number: 0,
      numberOfElements: 1,
      empty: false,
    };

    it("should fetch filtered work items with default parameters", () => {
      service.getFilteredWorkItems().subscribe((response) => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items?page=0&size=20&sort=objectId,asc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({});
      req.flush(mockPageResponse);
    });

    it("should handle all filter parameters with custom page and sort", async () => {
      const filter: WorkItemFilterApiRequest = {
        search: "abc xyz",
        workItemPriority: WorkItemPriority.HIGH,
        workItemType: WorkItemType.AGGREGATE,
        projectIds: ["p1", "p2"],
        objectIds: ["WI-1", "WI-2"],
        assignees: ["alice", "bob"],
        dueDateFrom: "2023-01-10",
        dueDateTo: "2023-10-31",
        resolvedDateSince: "2023-05-01",
        workItemCategories: ["dev", "ops"],
      };
      const expectedUrl =
        "https://api-gateway/work-item-management/work-items?page=2&size=50&sort=objectId,asc";

      const promise = firstValueFrom(
        service.getFilteredWorkItems(filter, 2, 50, "objectId,asc")
      );

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(filter);
      req.flush(mockPageResponse);
      const response = await promise;
      expect(response).toEqual(mockPageResponse);
    });

    it("should handle empty arrays by omitting them from params", async () => {
      const filter: WorkItemFilterApiRequest = {
        projectIds: [],
        objectIds: [],
        assignees: [],
        workItemCategories: [],
      };

      const promise = firstValueFrom(service.getFilteredWorkItems(filter));

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items?page=0&size=20&sort=objectId,asc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(filter);
      req.flush(mockPageResponse);

      const response = await promise;
      expect(response).toEqual(mockPageResponse);
    });

    it("should handle single object id correctly", async () => {
      const filter: WorkItemFilterApiRequest = {
        objectIds: ["WI-42"],
      };
      const promise = firstValueFrom(service.getFilteredWorkItems(filter));

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items?page=0&size=20&sort=objectId,asc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(filter);
      req.flush(mockPageResponse);

      const response = await promise;
      expect(response).toEqual(mockPageResponse);
    });

    it("should handle empty filter object", () => {
      service.getFilteredWorkItems({}).subscribe((response) => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items?page=0&size=20&sort=objectId,asc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({});
      req.flush(mockPageResponse);
    });

    it("should handle undefined filter parameter", () => {
      service
        .getFilteredWorkItems(undefined as unknown as WorkItemFilterApiRequest)
        .subscribe((response) => {
          expect(response).toEqual(mockPageResponse);
        });

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items?page=0&size=20&sort=objectId,asc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({});
      req.flush(mockPageResponse);
    });

    it("should handle server errors", async () => {
      const mockError = { status: 500, statusText: "Server Error" };
      const promise = firstValueFrom(service.getFilteredWorkItems());

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items?page=0&size=20&sort=objectId,asc"
      );
      req.flush("Server error", mockError);

      await expect(promise).rejects.toMatchObject({ status: 500 });
    });

    it("should handle not found errors", async () => {
      const mockError = { status: 404, statusText: "Not Found" };
      const promise = firstValueFrom(
        service.getFilteredWorkItems({ projectIds: ["p1"] })
      );

      const req = httpMock.expectOne(
        "https://api-gateway/work-item-management/work-items?page=0&size=20&sort=objectId,asc"
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({ projectIds: ["p1"] });
      req.flush("Not found", mockError);

      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });
});
