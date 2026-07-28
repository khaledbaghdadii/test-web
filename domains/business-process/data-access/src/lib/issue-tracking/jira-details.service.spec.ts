import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { v4 as uuid } from "uuid";
import { JiraDetailsService } from "./jira-details.service";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";

describe("JiraDetailsService", () => {
  const gatewayUrl = "https://gateway/";
  const projectId = uuid();

  let httpTesting: HttpTestingController;
  let service: JiraDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JiraDetailsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl } },
      ],
    });

    service = TestBed.inject(JiraDetailsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("sends a GET request to the project-details URL", () => {
    const expectedUrl = `${gatewayUrl}issue-tracking/projects/${projectId}/project-details`;

    service.getJiraDetails(projectId).subscribe();

    const request = httpTesting.expectOne(expectedUrl);
    expect(request.request.method).toBe("GET");
    request.flush({
      projectId,
      issueTrackerProjectId: "JP",
      issueTrackerBaseUrl: "https://jira.example.com",
    });
  });

  it("maps issueTrackerBaseUrl to jiraBaseUrl", async () => {
    const result = lastValueFrom(service.getJiraDetails(projectId));

    httpTesting
      .expectOne(
        `${gatewayUrl}issue-tracking/projects/${projectId}/project-details`
      )
      .flush({
        projectId,
        issueTrackerProjectId: "JP",
        issueTrackerBaseUrl: "https://jira.example.com",
      });

    await expect(result).resolves.toEqual({
      projectId,
      jiraProjectId: "JP",
      jiraBaseUrl: "https://jira.example.com",
    });
  });

  it("throws the error message from the API response", async () => {
    const errorMessage = uuid();

    const result = lastValueFrom(service.getJiraDetails(projectId));

    httpTesting
      .expectOne(
        `${gatewayUrl}issue-tracking/projects/${projectId}/project-details`
      )
      .flush({ message: errorMessage }, { status: 500, statusText: "Error" });

    await expect(result).rejects.toThrow(errorMessage);
  });
});
