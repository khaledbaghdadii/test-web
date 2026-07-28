import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { v4 as uuid } from "uuid";
import { SharedJiraDetailsService } from "./shared-jira-details.service";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";

describe("SharedJiraDetailsService", () => {
  const gatewayUrl = "https://gateway/";
  const projectId = uuid();

  let httpTesting: HttpTestingController;
  let service: SharedJiraDetailsService;

  function projectDetailsUrl(id: string): string {
    return `${gatewayUrl}issue-tracking/projects/${id}/project-details`;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl } },
      ],
    });

    service = TestBed.inject(SharedJiraDetailsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("issues a single request when the same project is requested by many consumers", () => {
    service.getJiraDetails(projectId).subscribe();
    service.getJiraDetails(projectId).subscribe();
    service.getJiraDetails(projectId).subscribe();

    const request = httpTesting.expectOne(projectDetailsUrl(projectId));
    expect(request.request.method).toBe("GET");
    request.flush({
      projectId,
      issueTrackerProjectId: "JP",
      issueTrackerBaseUrl: "https://jira.example.com",
    });
  });

  it("replays the resolved jira details to a consumer that subscribes after the request completed", async () => {
    service.getJiraDetails(projectId).subscribe();
    httpTesting.expectOne(projectDetailsUrl(projectId)).flush({
      projectId,
      issueTrackerProjectId: "JP",
      issueTrackerBaseUrl: "https://jira.example.com",
    });

    const lateResult = await new Promise((resolve) =>
      service.getJiraDetails(projectId).subscribe(resolve)
    );

    expect(lateResult).toEqual({
      projectId,
      jiraProjectId: "JP",
      jiraBaseUrl: "https://jira.example.com",
    });
    httpTesting.expectNone(projectDetailsUrl(projectId));
  });

  it("issues a separate request for a different project", () => {
    const otherProjectId = uuid();

    service.getJiraDetails(projectId).subscribe();
    service.getJiraDetails(otherProjectId).subscribe();

    const firstRequest = httpTesting.expectOne(projectDetailsUrl(projectId));
    expect(firstRequest.request.method).toBe("GET");
    firstRequest.flush({
      projectId,
      issueTrackerProjectId: "JP",
      issueTrackerBaseUrl: "https://jira.example.com",
    });
    const otherRequest = httpTesting.expectOne(
      projectDetailsUrl(otherProjectId)
    );
    expect(otherRequest.request.method).toBe("GET");
    otherRequest.flush({
      projectId: otherProjectId,
      issueTrackerProjectId: "OP",
      issueTrackerBaseUrl: "https://jira.other.com",
    });
  });
});
