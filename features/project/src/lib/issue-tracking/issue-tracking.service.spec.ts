import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { lastValueFrom } from "rxjs";
import { IssueTrackingService } from "./issue-tracking.service";
import { APP_CONFIG } from "@mxflow/config";
import { IssueTrackerDetailsApiRequest } from "./issue-tracker-details-api-request";
import { IssueTrackerDetailsApiResponse } from "./issue-tracker-details-api-response";
import { JiraDetailsRequest } from "./jira/jira-details-request";
import { JiraDetailsResponse } from "./jira/jira-details-response";

describe("IssueTrackingService", () => {
  let service: IssueTrackingService;
  let httpMock: HttpTestingController;
  const mockConfig = { gatewayUrl: "http://localhost:8080/" };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IssueTrackingService,
        { provide: APP_CONFIG, useValue: mockConfig },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(IssueTrackingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should update the issue tracker details associated with a certain project", async () => {
    const projectId = "project-123";
    const request: JiraDetailsRequest = {
      jiraProjectId: "PROJ-123",
    };

    const update$ = lastValueFrom(
      service.updateJiraDetails(projectId, request)
    );

    const req = httpMock.expectOne(
      "http://localhost:8080/issue-tracking/projects/project-123/project-details"
    );
    expect(req.request.method).toBe("PUT");
    const expectedBody: IssueTrackerDetailsApiRequest = {
      issueTrackerProjectId: "PROJ-123",
    };
    expect(req.request.body).toEqual(expectedBody);

    req.flush(null);

    await expect(update$).resolves.toBeNull();
  });

  it("should fetch the issue tracker details associated with a certain project", async () => {
    const projectId = "project-456";
    const mockApiResponse: IssueTrackerDetailsApiResponse = {
      projectId: "project-456",
      issueTrackerProjectId: "PROJ-456",
      issueTrackerBaseUrl: "https://jira.example.com",
    };

    const details$ = lastValueFrom(service.getJiraDetails(projectId));

    const req = httpMock.expectOne(
      "http://localhost:8080/issue-tracking/projects/project-456/project-details"
    );
    expect(req.request.method).toBe("GET");

    req.flush(mockApiResponse);

    const expectedResponse: JiraDetailsResponse = {
      projectId: "project-456",
      jiraProjectId: "PROJ-456",
      jiraBaseUrl: "https://jira.example.com",
    };
    expect(await details$).toEqual(expectedResponse);
  });

  it("should handle error when updating issue tracker details", async () => {
    const projectId = "project-789";
    const request: JiraDetailsRequest = {
      jiraProjectId: "PROJ-789",
    };

    const update$ = service.updateJiraDetails(projectId, request);
    const promise = lastValueFrom(update$);

    const req = httpMock.expectOne(
      "http://localhost:8080/issue-tracking/projects/project-789/project-details"
    );

    req.flush("Update failed", {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(promise).rejects.toBeDefined();
  });

  it("should handle error when fetching issue tracker details", async () => {
    const projectId = "project-999";

    const details$ = service.getJiraDetails(projectId);
    const promise = lastValueFrom(details$);

    const req = httpMock.expectOne(
      "http://localhost:8080/issue-tracking/projects/project-999/project-details"
    );

    req.flush("Not found", { status: 404, statusText: "Not Found" });

    await expect(promise).rejects.toBeDefined();
  });
});
