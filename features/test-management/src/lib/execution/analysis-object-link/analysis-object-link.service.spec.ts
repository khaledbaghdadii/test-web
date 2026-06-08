import { AnalysisObjectLinkService } from "./analysis-object-link.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import {
  analysisObjectId1,
  analysisObjectLink1,
  analysisObjectLink2,
  analysisObjectLink3,
  projectId,
  scenarioExecutionId,
  testCaseExecutionAnalysisObjectLinkModel,
  testCaseExecutionAnalysisObjectLinkModel2,
} from "./analysis-object-link-test-utils";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { CreateCandidateAnalysisObjectLinksRequest } from "./candidate-analysis-object-link";
import {
  AnalysisObjectLinkedScenarioExecution,
  TestUnitAnalysisObjectLink,
} from "./analysis-object-link";
import { TestBed } from "@angular/core/testing";

describe("Analysis object link service", () => {
  let service: AnalysisObjectLinkService;
  let config: AppConfig;
  let http: HttpClient;
  const ANALYSIS_OBJECT_TYPE = AnalysisObjectType.BINARY_IMPACT;
  const ANALYSIS_OBJECT_ID = "testAnalysisObjectId";
  const TEST_UNIT_ID = "testTestUnitId";

  beforeEach(() => {
    config = {
      gatewayUrl: "apiUrl/",
    } as unknown as AppConfig;
    http = {
      get: jest.fn(() => of([analysisObjectLink1, analysisObjectLink2])),
      patch: jest.fn(() => of({})),
      post: jest.fn(() => of([])),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: config },
        { provide: HttpClient, useValue: http },
        AnalysisObjectLinkService,
      ],
    });
    service = TestBed.inject(AnalysisObjectLinkService);
  });

  describe("fetch distinct analysis object links", () => {
    it("should return an empty list if no links are present", (done) => {
      jest.spyOn(http, "get").mockReturnValue(of([]));
      service
        .fetchDistinct(projectId, scenarioExecutionId)
        .subscribe((links) => {
          expect(links).toEqual([]);
          done();
        });
    });

    it("should return the distinct scenario execution links", (done) => {
      jest.spyOn(http, "get").mockReturnValue(
        of([
          analysisObjectLink1,
          analysisObjectLink2,
          {
            ...analysisObjectLink3,
            analysisObjectId: analysisObjectId1,
          },
        ])
      );
      service
        .fetchDistinct(projectId, scenarioExecutionId)
        .subscribe((links) => {
          expect(links).toEqual([analysisObjectLink1, analysisObjectLink2]);
          done();
        });
    });

    it("should throw an error if failed to fetch the scenario execution links", (done) => {
      jest.spyOn(http, "get").mockReturnValue(throwError(() => "errorMessage"));
      service.fetchDistinct(projectId, scenarioExecutionId).subscribe({
        error: (err) => {
          expect(err).toEqual("errorMessage");
          done();
        },
      });
    });
  });

  describe("fetch analysis object links", () => {
    it("should return an empty list if no links are present", (done) => {
      jest.spyOn(http, "get").mockReturnValue(of([]));
      service.fetch(projectId, scenarioExecutionId).subscribe((links) => {
        expect(links).toEqual([]);
        done();
      });
    });

    it("should return the scenario execution links correctly", (done) => {
      service.fetch(projectId, scenarioExecutionId).subscribe((links) => {
        expect(links).toEqual([analysisObjectLink1, analysisObjectLink2]);
        done();
      });
    });

    it("should throw an error if failed to fetch the scenario execution links", (done) => {
      jest.spyOn(http, "get").mockReturnValue(throwError(() => "errorMessage"));
      service.fetch(projectId, scenarioExecutionId).subscribe({
        error: (err) => {
          expect(err).toEqual("errorMessage");
          done();
        },
      });
    });

    it("should filter on a specific analysis object type if filtering is requested", (done) => {
      jest.spyOn(http, "get").mockReturnValue(
        of([
          {
            ...analysisObjectLink1,
            analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
          },
          {
            ...analysisObjectLink2,
            analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
          },
        ])
      );
      service
        .fetch(
          projectId,
          scenarioExecutionId,
          AnalysisObjectType.CONFIGURATION_IMPACT
        )
        .subscribe((links) => {
          expect(links).toEqual([
            {
              ...analysisObjectLink2,
              analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
            },
          ]);
          done();
        });
    });
  });

  describe("fetch project specific analysis object links", () => {
    it("should call the fetch project specific links url with the project id, analysis object id, and an analysis object type", (done) => {
      const expectedUrl = `${config.gatewayUrl}projects/${projectId}/test-execution-manager/analysis-objects/${ANALYSIS_OBJECT_TYPE}/${ANALYSIS_OBJECT_ID}/scenario-executions`;
      service
        .fetchProjectSpecificAnalysisObjectLinks(
          projectId,
          ANALYSIS_OBJECT_ID,
          ANALYSIS_OBJECT_TYPE
        )
        .subscribe(() => {
          expect(http.get).toHaveBeenCalledWith(expectedUrl);
          done();
        });
    });

    it("should return the executions the analysis object id is linked to", (done) => {
      const projectSpecificLinks: AnalysisObjectLinkedScenarioExecution[] = [
        {
          scenarioExecutionId: "testScenarioExecutionId",
          testCaseExecutionId: "testCaseExecutionId",
          contextId: "testContextId",
          projectId: projectId,
          scenarioDefinitionId: "testScenarioDefinitionId",
        },
      ];
      jest.spyOn(http, "get").mockReturnValue(of(projectSpecificLinks));
      service
        .fetchProjectSpecificAnalysisObjectLinks(
          projectId,
          ANALYSIS_OBJECT_ID,
          ANALYSIS_OBJECT_TYPE
        )
        .subscribe((executions) => {
          expect(executions).toEqual(projectSpecificLinks);
          done();
        });
    });

    it("should throw an error on failure to fetch the project specific links", (done) => {
      jest.spyOn(http, "get").mockReturnValue(throwError(() => "errorMessage"));
      service
        .fetchProjectSpecificAnalysisObjectLinks(
          projectId,
          ANALYSIS_OBJECT_ID,
          ANALYSIS_OBJECT_TYPE
        )
        .subscribe({
          error: (err) => {
            expect(err).toEqual("errorMessage");
            done();
          },
        });
    });
  });

  describe("fetch global analysis object links", () => {
    it("should call the fetch global links url with the project id and scenario execution id", (done) => {
      const expectedUrl = `${config.gatewayUrl}test-execution-manager/analysis-objects/${ANALYSIS_OBJECT_TYPE}/${ANALYSIS_OBJECT_ID}/scenario-executions`;
      service
        .fetchGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          ANALYSIS_OBJECT_TYPE
        )
        .subscribe(() => {
          expect(http.get).toHaveBeenCalledWith(expectedUrl);
          done();
        });
    });

    it("should return the global analysis object links", (done) => {
      const globalLinks: AnalysisObjectLinkedScenarioExecution[] = [
        {
          scenarioExecutionId: "testScenarioExecutionId",
          testCaseExecutionId: "testCaseExecutionId",
          contextId: "testContextId",
          projectId: projectId,
          scenarioDefinitionId: "testScenarioDefinitionId",
        },
      ];
      jest.spyOn(http, "get").mockReturnValue(of(globalLinks));
      service
        .fetchGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          ANALYSIS_OBJECT_TYPE
        )
        .subscribe((links) => {
          expect(links).toEqual(globalLinks);
          done();
        });
    });

    it("should throw an error on failure to fetch the global links", (done) => {
      jest.spyOn(http, "get").mockReturnValue(throwError(() => "errorMessage"));
      service
        .fetchGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          ANALYSIS_OBJECT_TYPE
        )
        .subscribe({
          error: (err) => {
            expect(err).toEqual("errorMessage");
            done();
          },
        });
    });
  });

  describe("fetch test unit analysis object links", () => {
    it("should call the fetch test unit links url with the project id and testunit id", () => {
      const expectedUrl = `${config.gatewayUrl}projects/${projectId}/test-execution-manager/test-units/${TEST_UNIT_ID}/analysis-object-links`;
      service.fetchTestUnitAnalysisObjectLinks(projectId, TEST_UNIT_ID);
      expect(http.get).toHaveBeenCalledWith(expectedUrl);
    });

    it("should return the test unit analysis object links", async () => {
      const testUnitLinks: TestUnitAnalysisObjectLink[] = [
        {
          scenarioExecutionId: "scenarioExecutionId",
          testCaseExecution: {
            id: "testCaseExecutionId",
            externalId: "testTestCaseExternalId",
          },
          analysisObject: {
            id: ANALYSIS_OBJECT_ID,
            type: ANALYSIS_OBJECT_TYPE,
            title: "Test Analysis Object Title",
            readableId: "AO-1234",
            externalLink: "externalLink",
          },
          testUnitId: TEST_UNIT_ID,
          projectId: projectId,
        },
      ];
      jest.spyOn(http, "get").mockReturnValue(of(testUnitLinks));
      const actualTestUnitLinks = await lastValueFrom(
        service.fetchTestUnitAnalysisObjectLinks(projectId, TEST_UNIT_ID)
      );
      expect(actualTestUnitLinks).toEqual(testUnitLinks);
    });

    it("should throw an error on failure to fetch the global links", async () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });

      jest.spyOn(http, "get").mockReturnValue(throwError(() => errorResponse));
      await expect(
        lastValueFrom(
          service.fetchTestUnitAnalysisObjectLinks(projectId, TEST_UNIT_ID)
        )
      ).rejects.toEqual(errorResponse);
    });
  });

  describe("update analysis object links", () => {
    it("should call the correct URL for updating analysis object links", (done) => {
      const request = {
        linksToAdd: [testCaseExecutionAnalysisObjectLinkModel],
        linksToRemove: [testCaseExecutionAnalysisObjectLinkModel2],
      };
      const expectedUrl = `${config.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/analysis-object-links`;
      service.update(projectId, scenarioExecutionId, request).subscribe(() => {
        expect(http.patch).toHaveBeenCalledWith(expectedUrl, request);
        done();
      });
    });

    it("should handle error when updating analysis object links", (done) => {
      const request = {
        linksToAdd: [testCaseExecutionAnalysisObjectLinkModel],
        linksToRemove: [testCaseExecutionAnalysisObjectLinkModel2],
      };
      jest
        .spyOn(http, "patch")
        .mockReturnValue(throwError(() => "errorMessage"));
      service.update(projectId, scenarioExecutionId, request).subscribe({
        error: (err) => {
          expect(err).toEqual("errorMessage");
          done();
        },
      });
    });
  });

  describe("create analysis object link", () => {
    it("should delegate to update links with only one link to add", () => {
      const updateSpy = jest.spyOn(service, "update");
      service.createLink({
        scenarioExecutionId: scenarioExecutionId,
        projectId: projectId,
        link: testCaseExecutionAnalysisObjectLinkModel,
      });
      expect(updateSpy).toHaveBeenCalledWith(projectId, scenarioExecutionId, {
        linksToAdd: [testCaseExecutionAnalysisObjectLinkModel],
        linksToRemove: [],
      });
    });
  });

  describe("unlink analysis object", () => {
    it("should delegate to update links with only one link to remove", () => {
      const updateSpy = jest.spyOn(service, "update");
      service.unlink({
        scenarioExecutionId: scenarioExecutionId,
        projectId: projectId,
        link: testCaseExecutionAnalysisObjectLinkModel,
      });
      expect(updateSpy).toHaveBeenCalledWith(projectId, scenarioExecutionId, {
        linksToAdd: [],
        linksToRemove: [testCaseExecutionAnalysisObjectLinkModel],
      });
    });
  });

  describe("create candidate analysis object link", () => {
    const request: CreateCandidateAnalysisObjectLinksRequest = {
      analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
      candidateLinks: [
        {
          testCaseExecutionId: "testCaseExecutionId",
        },
      ],
    };

    it("should call the correct URL for creating candidate analysis object links", (done) => {
      const expectedUrl = `${config.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/candidate-analysis-object-links`;
      service
        .createCandidateAnalysisObjectLinks(
          projectId,
          scenarioExecutionId,
          request
        )
        .subscribe(() => {
          expect(http.post).toHaveBeenCalledWith(expectedUrl, request);
          done();
        });
    });

    it("should return the candidate analysis object links", (done) => {
      const expectedResponse = { id: "candidate1" };
      jest.spyOn(http, "post").mockReturnValue(of(expectedResponse));
      service
        .createCandidateAnalysisObjectLinks(
          projectId,
          scenarioExecutionId,
          request
        )
        .subscribe((response) => {
          expect(response).toEqual(expectedResponse);
          done();
        });
    });

    it("should handle error when creating candidate analysis object links", (done) => {
      jest
        .spyOn(http, "post")
        .mockReturnValue(throwError(() => "errorMessage"));
      service
        .createCandidateAnalysisObjectLinks(
          projectId,
          scenarioExecutionId,
          request
        )
        .subscribe({
          error: (err) => {
            expect(err).toEqual("errorMessage");
            done();
          },
        });
    });
  });
});
