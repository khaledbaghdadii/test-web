import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { FurtherAnalysisService } from "./further-analysis.service";

const GATEWAY_URL = "https://api.test.com/";
const BASE_URL = `${GATEWAY_URL}projects/projectId/business-process/executions/binary-upgrade/executionId`;

const projectId = "projectId";
const processId = "executionId";
const expectedErrorMessage = "Internal server error";

describe("FurtherAnalysisService", () => {
  let service: FurtherAnalysisService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
        FurtherAnalysisService,
      ],
    });

    service = TestBed.inject(FurtherAnalysisService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe("get Further Analysis Candidates", () => {
    it("when requested to fetch the further analysis candidates, then the system should retrieve them", () => {
      const expectedCandidates = {
        candidates: [
          {
            id: "environmentId",
            tags: ["tag"],
            linkedScenario: {
              id: "scenarioId",
              name: "ScenarioName",
              linkedIncidents: [
                {
                  id: "incidentId",
                  externalIssueId: "externalIssueId",
                  externalIssueLink: "externalIssueLink",
                },
              ],
            },
          },
        ],
      };

      service
        .getFurtherAnalysisCandidates(projectId, processId)
        .subscribe((response) => expect(response).toEqual(expectedCandidates));

      const request = httpTestingController.expectOne(
        `${BASE_URL}/further-analysis/candidates`
      );

      expect(request.request.method).toBe("GET");
      request.flush(expectedCandidates);
    });

    it("given a failure occurs when fetching the further analysis then the system should propagate the error", () => {
      let errorMessage: string | undefined;

      service.getFurtherAnalysisCandidates(projectId, processId).subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

      httpTestingController
        .expectOne(`${BASE_URL}/further-analysis/candidates`)
        .flush(
          { message: expectedErrorMessage },
          { status: 500, statusText: expectedErrorMessage }
        );

      expect(errorMessage).toBe(expectedErrorMessage);
    });
  });

  describe("mark Resources For Further Analysis", () => {
    it("when requested to mark resources for further analysis then the system should mark the kept resources selection", () => {
      const body = {
        scenarioIds: ["scenario-1", "scenario-2"],
        environmentIds: ["env-1", "env-2"],
      };

      service
        .markResourcesForFurtherAnalysis(projectId, processId, body)
        .subscribe();

      const request = httpTestingController.expectOne(
        `${BASE_URL}/further-analysis/resources`
      );

      expect(request.request.method).toBe("PUT");
      expect(request.request.body).toEqual(body);
      request.flush(null);
    });

    it("given a failure occurs when marking resources for further analysis then the system should propagate the error", () => {
      let errorMessage: string | undefined;

      service
        .markResourcesForFurtherAnalysis(projectId, processId, {
          scenarioIds: ["scenario-1", "scenario-2"],
          environmentIds: ["env-1", "env-2"],
        })
        .subscribe({
          error: (error) => {
            errorMessage = error.message;
          },
        });

      httpTestingController
        .expectOne(`${BASE_URL}/further-analysis/resources`)
        .flush(
          { message: expectedErrorMessage },
          { status: 500, statusText: expectedErrorMessage }
        );

      expect(errorMessage).toBe(expectedErrorMessage);
    });
  });

  describe("getSelectedResources", () => {
    it("when requested to fetch selected resources for further analysis then the system should retrieve them", () => {
      const expectedResources = {
        resources: [
          {
            id: "environmentId",
            tags: ["tag"],
            linkedScenario: {
              id: "scenarioId",
              name: "ScenarioName",
              linkedIncidents: [
                {
                  id: "incidentId",
                  externalIssueId: "externalIssueId",
                  externalIssueLink: "externalIssueLink",
                },
              ],
            },
          },
        ],
      };

      service
        .getSelectedResources(projectId, processId)
        .subscribe((response) => expect(response).toEqual(expectedResources));

      const request = httpTestingController.expectOne(
        `${BASE_URL}/further-analysis/resources`
      );

      expect(request.request.method).toBe("GET");
      request.flush(expectedResources);
    });

    it("given a failure occurs when fetching selected resources for further analysis then the system should propagate the error", () => {
      let errorMessage: string | undefined;

      service.getSelectedResources(projectId, processId).subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

      httpTestingController
        .expectOne(`${BASE_URL}/further-analysis/resources`)
        .flush(
          { message: expectedErrorMessage },
          { status: 500, statusText: "Internal Server Error" }
        );

      expect(errorMessage).toBe(expectedErrorMessage);
    });
  });
});
