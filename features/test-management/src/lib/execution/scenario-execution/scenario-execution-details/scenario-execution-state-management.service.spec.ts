import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { ScenarioExecutionStateManagementService } from "./scenario-execution-state-management.service";
import {
  errorMessage,
  projectId,
  scenarioExecution,
  scenarioExecutionId,
  testUnitId1,
} from "../scenario-execution-test-utils";
import { ScenarioAnalysisStatus } from "../scenario-analysis-status/scenario-analysis-status";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { delay, lastValueFrom, of, throwError } from "rxjs";
import { Store } from "@ngrx/store";
import { AnalysisObjectLinkService } from "../../analysis-object-link/analysis-object-link.service";
import {
  analysisObjectId1,
  analysisObjectLink1,
  analysisObjectLink2,
  analysisObjectLink3,
  incidents,
} from "../../analysis-object-link/analysis-object-link-test-utils";
import {
  testCaseExecution1,
  testCaseExecution2,
} from "../../test-case-execution/test-case-execution-utils";
import { TestCaseExecutionService } from "../../test-case-execution/test-case-execution.service";
import { AuthorizationService } from "@mxflow/core/auth";
import { ValidationScope } from "@mxflow/features/validation-management";
import { IncidentService } from "@mxflow/features/incident-management";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { TestCaseExecutionStatus } from "../../test-case-execution/status/test-case-execution-status";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import {
  TestUnitAnalysisObjectLink,
  TestUnitModel,
  TestUnitScenarioExecutionModel,
  TestUnitService,
} from "../..";
import { TestCaseExecutionAnalyzabilityService } from "../../test-case-execution/test-case-execution-analyzability.service";

describe("ScenarioExecutionStateManagementService", () => {
  let service: ScenarioExecutionStateManagementService;
  let scenarioExecutionService: ScenarioExecutionService;
  let analysisObjectLinkService: AnalysisObjectLinkService;
  let testCaseExecutionService: TestCaseExecutionService;
  let incidentService: IncidentService;
  let authorizationService: AuthorizationService;
  let store: Store;
  let testUnitService: TestUnitService;
  let testCaseExecutionAnalyzabilityService: TestCaseExecutionAnalyzabilityService;

  const TEST_UNIT = {
    id: testUnitId1,
  } as unknown as TestUnitModel;

  beforeEach(() => {
    scenarioExecutionService = {
      getScenarioExecution: jest.fn(() => of(scenarioExecution)),
    } as unknown as ScenarioExecutionService;
    analysisObjectLinkService = {
      createLink: jest.fn(() => of(undefined)),
      unlink: jest.fn(() => of(undefined)),
      update: jest.fn(() => of(undefined)),
      fetch: jest.fn(() => of([analysisObjectLink1, analysisObjectLink2])),
      fetchTestUnitAnalysisObjectLinks: jest.fn(() => of([])),
    } as unknown as AnalysisObjectLinkService;
    testCaseExecutionService = {
      fetch: jest.fn(() => of([testCaseExecution1, testCaseExecution2])),
    } as unknown as TestCaseExecutionService;
    incidentService = {
      fetchIncidentsByIds: jest.fn(() => of(incidents)),
    } as unknown as IncidentService;
    store = {
      select: jest.fn(() => of(projectId)),
    } as unknown as Store;
    authorizationService = {
      isAuthorized: jest.fn(() => {
        return of(true);
      }),
    } as unknown as AuthorizationService;
    testUnitService = {
      fetchById: jest.fn(() => of(TEST_UNIT)),
    } as unknown as TestUnitService;
    testCaseExecutionAnalyzabilityService = {
      isAnalyzable: jest.fn(() => true),
    } as unknown as TestCaseExecutionAnalyzabilityService;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ScenarioExecutionService,
          useValue: scenarioExecutionService,
        },
        { provide: Store, useValue: store },
        {
          provide: AnalysisObjectLinkService,
          useValue: analysisObjectLinkService,
        },
        {
          provide: TestCaseExecutionService,
          useValue: testCaseExecutionService,
        },
        {
          provide: IncidentService,
          useValue: incidentService,
        },
        {
          provide: AuthorizationService,
          useValue: authorizationService,
        },
        {
          provide: TestUnitService,
          useValue: testUnitService,
        },
        {
          provide: TestCaseExecutionAnalyzabilityService,
          useValue: testCaseExecutionAnalyzabilityService,
        },
        ScenarioExecutionStateManagementService,
      ],
    });
    service = TestBed.inject(ScenarioExecutionStateManagementService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("signal default values", () => {
    it("should have a default project id signal", () => {
      expect(service.projectId()).toEqual("");
    });

    it("should have a default scenario execution id signal", () => {
      expect(service.scenarioExecutionId()).toEqual("");
    });

    it("should have a default loading value false", () => {
      expect(service.isScenarioExecutionDetailsLoading()).toEqual(false);
    });

    it("should have a default scenario execution signal", () => {
      expect(service.scenarioExecution()).toEqual({
        id: "",
        comment: "",
        analysisStatus: ScenarioAnalysisStatus.NA,
        testExecutions: [],
      });
    });
  });

  describe("initialize", () => {
    it("#initialize should fetch the projectId form the store correctly", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.projectId()).toEqual(projectId);
    });

    it("#initialize should set the project id on fetching the project id successfully", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.projectId()).toEqual(projectId);
    });

    it("#initialize should keep the projectId falsy if failed to fetch it from the store", async () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
      expect(service.projectId()).toEqual("");
    });

    it("#initialize should throw an error if failed to fetch the project id from the store", async () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
    });

    it("#initialize should fetch the scenario execution from the service", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(
        scenarioExecutionService.getScenarioExecution
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId);
    });

    it("#initialize should throw an error on failure to fetch the scenario execution", async () => {
      jest
        .spyOn(scenarioExecutionService, "getScenarioExecution")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
    });

    it("#initialize should return the fetched scenario execution", async () => {
      const scenarioExecution = await lastValueFrom(
        service.initialize(scenarioExecutionId)
      );
      expect(scenarioExecution).toEqual(scenarioExecution);
    });

    it("#initialize should set the fetched scenario execution on the service", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.scenarioExecution()).toEqual(scenarioExecution);
    });

    it("#initialize should set the scenarioExecutionId on fetching the scenario execution successfully", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.scenarioExecutionId()).toEqual(scenarioExecutionId);
    });

    it("#initialize should not set the scenarioExecutionId if failed to fetch the scenario execution", async () => {
      jest
        .spyOn(scenarioExecutionService, "getScenarioExecution")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
      expect(service.scenarioExecutionId()).toBeFalsy();
    });

    it("#initialize should not fetch the analysis object links if failed to fetch the project id", async () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
      expect(analysisObjectLinkService.fetch).not.toHaveBeenCalled();
    });

    it("#initialize should not fetch the analysis object links if failed to fetch the scenario execution id", async () => {
      jest
        .spyOn(scenarioExecutionService, "getScenarioExecution")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
      expect(analysisObjectLinkService.fetch).not.toHaveBeenCalled();
    });

    it("#initialize should fetch the analysis object links correctly", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
      ]);
    });

    it("#initialize should throw an error if failed to fetch the analysis links", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
    });

    it("should set analysis objects links loading to true when starting to fetch analysis objects", () => {
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(of([]).pipe(delay(3000)));
      service.initialize(scenarioExecutionId).subscribe();
      expect(service.analysisObjectLinksLoading()).toEqual(true);
    });

    it("should set is loading to false when loading analysis object links is done", async () => {
      jest.spyOn(analysisObjectLinkService, "fetch").mockReturnValue(of([]));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinksLoading()).toEqual(false);
    });

    it("#initialize should fetch the analysis object links correctly if the user is authorized to view them", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(analysisObjectLinkService.fetch).toHaveBeenCalled();
    });

    it("#initialize should not fetch the analysis object links if the user is not authorized to view them", async () => {
      jest
        .spyOn(authorizationService, "isAuthorized")
        .mockReturnValue(of(false));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(analysisObjectLinkService.fetch).not.toHaveBeenCalled();
    });

    it("should not fetch the test case executions if failed to fetch the project id", async () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
      expect(testCaseExecutionService.fetch).not.toHaveBeenCalled();
    });

    it("should not fetch the test case executions if failed to fetch the scenario execution id", async () => {
      jest
        .spyOn(scenarioExecutionService, "getScenarioExecution")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
      expect(testCaseExecutionService.fetch).not.toHaveBeenCalled();
    });

    it("should not fetch the test case executions if failed to fetch the selected scenario execution", async () => {
      jest
        .spyOn(scenarioExecutionService, "getScenarioExecution")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
      expect(testCaseExecutionService.fetch).not.toHaveBeenCalled();
    });

    it("should set analyzable test case executions to empty list if no test case executions are present", async () => {
      jest.spyOn(testCaseExecutionService, "fetch").mockReturnValue(of([]));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analyzableTestCaseExecutions()).toEqual([]);
    });

    it("should set analyzable test case execution to empty if no analyzable test case executions are present", async () => {
      const nonAnalyzableTestCaseExecution1 = {
        ...testCaseExecution1,
      };
      const nonAnalyzableTestCaseExecution2 = {
        ...testCaseExecution2,
      };
      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isAnalyzable")
        .mockReturnValue(false);
      jest
        .spyOn(testCaseExecutionService, "fetch")
        .mockReturnValue(
          of([nonAnalyzableTestCaseExecution1, nonAnalyzableTestCaseExecution2])
        );
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analyzableTestCaseExecutions()).toEqual([]);
    });

    it("should set the analyzable test case executions list correctly", async () => {
      jest
        .spyOn(testCaseExecutionService, "fetch")
        .mockReturnValue(
          of([testCaseExecution1, testCaseExecution2, testCaseExecution3])
        );
      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isAnalyzable")
        .mockImplementation(
          (tce: TestCaseExecution) => tce.id != testCaseExecution1.id
        );
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analyzableTestCaseExecutions()).toEqual([
        testCaseExecution2,
        testCaseExecution3,
      ]);
    });

    it("should return an empty list if no test case executions were found", async () => {
      jest.spyOn(testCaseExecutionService, "fetch").mockReturnValue(of([]));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.testCaseExecutions()).toEqual([]);
    });

    it("should fetch the test case executions correctly", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.testCaseExecutions()).toEqual([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      expect(testCaseExecutionService.fetch).toHaveBeenCalledWith({
        projectId,
        params: { scenarioExecutionId },
      });
    });

    it("should set test case executions loading to true when starting to fetch test case executions", () => {
      jest
        .spyOn(testCaseExecutionService, "fetch")
        .mockReturnValue(of([]).pipe(delay(3000)));
      service.initialize(scenarioExecutionId).subscribe();
      expect(service.testCaseExecutionsLoading()).toEqual(true);
    });

    it("should set is loading to false when loading test case executions is done", async () => {
      jest.spyOn(testCaseExecutionService, "fetch").mockReturnValue(of([]));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.testCaseExecutionsLoading()).toEqual(false);
    });

    it("should throw an error if failed to fetch the test case executions", async () => {
      jest
        .spyOn(testCaseExecutionService, "fetch")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
    });

    it("should fetch the test unit of the scenario execution", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(testUnitService.fetchById).toHaveBeenCalledWith(
        projectId,
        testUnitId1
      );
    });

    it("should set the test unit of the scenario execution", async () => {
      jest.spyOn(testUnitService, "fetchById").mockReturnValue(of(TEST_UNIT));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.testUnit()).toEqual(TEST_UNIT);
    });

    it("should not fetch the test unit if failed to fetch the selected scenario execution", async () => {
      jest
        .spyOn(scenarioExecutionService, "getScenarioExecution")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
      expect(testUnitService.fetchById).not.toHaveBeenCalled();
    });

    it("should throw an error on failure to fetch the test unit", async () => {
      jest
        .spyOn(testUnitService, "fetchById")
        .mockReturnValue(throwError(() => errorMessage));
      await expect(
        lastValueFrom(service.initialize(scenarioExecutionId))
      ).rejects.toEqual(errorMessage);
    });

    it("should fetch the test unit analysis object links if the user is authorized to view links", async () => {
      jest
        .spyOn(authorizationService, "isAuthorized")
        .mockReturnValue(of(true));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(
        analysisObjectLinkService.fetchTestUnitAnalysisObjectLinks
      ).toHaveBeenCalledWith(projectId, testUnitId1);
    });

    it("should not fetch the test unit analysis object links if the user is not authorized to view links", async () => {
      jest
        .spyOn(authorizationService, "isAuthorized")
        .mockReturnValue(of(false));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(
        analysisObjectLinkService.fetchTestUnitAnalysisObjectLinks
      ).not.toHaveBeenCalled();
      expect(service.testUnitAnalysisObjectLinks()).toEqual([]);
    });

    it("should update the list of test unit analysis object links after fetching them", async () => {
      const testUnitAnalysisObjectLink1: TestUnitAnalysisObjectLink = {
        projectId,
        scenarioExecutionId: scenarioExecutionId,
        testUnitId: testUnitId1,
        analysisObject: {
          id: analysisObjectId1,
          title: "title",
          readableId: "readableId",
          type: AnalysisObjectType.INCIDENT,
          externalLink: "externalLink",
        },
        testCaseExecution: {
          id: testCaseExecution1.id,
          externalId: testCaseExecution1.externalId,
        },
      };

      jest
        .spyOn(analysisObjectLinkService, "fetchTestUnitAnalysisObjectLinks")
        .mockReturnValue(of([testUnitAnalysisObjectLink1]));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.testUnitAnalysisObjectLinks()).toEqual([
        testUnitAnalysisObjectLink1,
      ]);
    });

    it("should set test unit analysis object links loading to true when starting to fetch test unit analysis object links", () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchTestUnitAnalysisObjectLinks")
        .mockReturnValue(of([]).pipe(delay(3000)));
      service.initialize(scenarioExecutionId).subscribe();
      expect(service.testUnitAnalysisObjectLinksLoading()).toEqual(true);
    });

    it("should set test unit analysis object links loading to false when done fetching test unit analysis object links", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchTestUnitAnalysisObjectLinks")
        .mockReturnValue(of([]));
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.testUnitAnalysisObjectLinksLoading()).toEqual(false);
    });

    it("should complete without error when initialize is called", async () => {
      await expect(
        lastValueFrom(service.initialize("scenarioId"))
      ).resolves.not.toThrow();
    });
  });

  describe("state setters", () => {
    beforeEach(() => {
      service["_fetchedScenarioExecution"].set(scenarioExecution);
    });

    it("#setLoading should set the loading to true", () => {
      service.setLoading(true);
      expect(service.isScenarioExecutionDetailsLoading()).toEqual(true);
    });

    it("#setLoading set the loading to false", () => {
      service.setLoading(false);
      expect(service.isScenarioExecutionDetailsLoading()).toEqual(false);
    });

    it("#setAnalysisStatus should update the selected analysis status", fakeAsync(() => {
      service.setAnalysisStatus(ScenarioAnalysisStatus.FAILED);
      expect(service.scenarioExecution()).toEqual({
        ...scenarioExecution,
        analysisStatus: ScenarioAnalysisStatus.FAILED,
      });
    }));

    it("#setAnalysisStatus should not update the selected analysis status if the new status is undefined", fakeAsync(() => {
      service.setAnalysisStatus(undefined);
      tick();
      expect(service.scenarioExecution()).toEqual(scenarioExecution);
    }));

    it("#setComment should update the selected comment", fakeAsync(() => {
      service.setComment("new comment");
      tick();
      expect(service.scenarioExecution()).toEqual({
        ...scenarioExecution,
        comment: "new comment",
      });
    }));

    it.each([false, true])(
      "#setKeepExecution should update the keepExecution flag",
      fakeAsync((keptExecution: boolean) => {
        service.setKeptExecution(keptExecution);
        tick();
        expect(service.scenarioExecution().keptExecution).toEqual(
          keptExecution
        );
      })
    );

    describe("setKeptExecutionForTestUnitScenarioExecution", () => {
      it("should return undefined if testunit is undefined", () => {
        service["_testUnit"].set(undefined);
        service.setKeptExecutionForTestUnitScenarioExecution(
          scenarioExecutionId,
          true
        );
        expect(service.testUnit()).toBeUndefined();
      });

      it("should not modify the test unit if it has no scenario executions", async () => {
        jest.spyOn(testUnitService, "fetchById").mockReturnValue(
          of({
            ...TEST_UNIT,
            scenarioExecutions: [],
          })
        );
        await lastValueFrom(service.initialize(scenarioExecutionId));
        service.setKeptExecutionForTestUnitScenarioExecution(
          scenarioExecutionId,
          true
        );
        expect(service.testUnit()).toEqual({
          ...TEST_UNIT,
          scenarioExecutions: [],
        });
      });

      it("should not modify the test unit if the scenario execution id does not match any in the test unit", async () => {
        const testUnitScenarioExecution = {
          id: scenarioExecutionId,
        } as unknown as TestUnitScenarioExecutionModel;
        const testUnitWithScenarioExecutions = {
          ...TEST_UNIT,
          scenarioExecutions: [testUnitScenarioExecution],
        } as unknown as TestUnitModel;
        jest
          .spyOn(testUnitService, "fetchById")
          .mockReturnValue(of(testUnitWithScenarioExecutions));
        await lastValueFrom(service.initialize(scenarioExecutionId));
        service.setKeptExecutionForTestUnitScenarioExecution(
          "anotherScenarioExecutionId",
          true
        );
        expect(service.testUnit()).toEqual(testUnitWithScenarioExecutions);
      });

      it("should update the kept execution flag for the matching scenario execution in the test unit", async () => {
        const testUnitScenarioExecution = {
          id: scenarioExecutionId,
          keptExecution: false,
        } as unknown as TestUnitScenarioExecutionModel;
        const testUnitWithScenarioExecutions = {
          ...TEST_UNIT,
          scenarioExecutions: [testUnitScenarioExecution],
        } as unknown as TestUnitModel;
        jest
          .spyOn(testUnitService, "fetchById")
          .mockReturnValue(of(testUnitWithScenarioExecutions));
        await lastValueFrom(service.initialize(scenarioExecutionId));
        service.setKeptExecutionForTestUnitScenarioExecution(
          scenarioExecutionId,
          true
        );
        expect(service.testUnit()).toEqual({
          ...testUnitWithScenarioExecutions,
          scenarioExecutions: [
            {
              ...testUnitScenarioExecution,
              keptExecution: true,
            },
          ],
        });
      });

      it("should not update the kept execution flag for non-matching scenario executions", async () => {
        const testUnitScenarioExecution1 = {
          id: scenarioExecutionId,
          keptExecution: false,
        } as unknown as TestUnitScenarioExecutionModel;
        const testUnitScenarioExecution2 = {
          id: "scenarioExecutionId2",
          keptExecution: false,
        } as unknown as TestUnitScenarioExecutionModel;
        const testUnitWithScenarioExecutions = {
          ...TEST_UNIT,
          scenarioExecutions: [
            testUnitScenarioExecution1,
            testUnitScenarioExecution2,
          ],
        } as unknown as TestUnitModel;
        jest
          .spyOn(testUnitService, "fetchById")
          .mockReturnValue(of(testUnitWithScenarioExecutions));
        await lastValueFrom(service.initialize(scenarioExecutionId));
        service.setKeptExecutionForTestUnitScenarioExecution(
          scenarioExecutionId,
          true
        );
        expect(service.testUnit()).toEqual({
          ...testUnitWithScenarioExecutions,
          scenarioExecutions: [
            {
              ...testUnitScenarioExecution1,
              keptExecution: true,
            },
            testUnitScenarioExecution2,
          ],
        });
      });
    });

    it("#setValidationScope should update the validation scope", () => {
      const validationScope: ValidationScope = {
        referenceVersion: "referenceVersion",
        currentVersion: "currentVersion",
      };
      service.setValidationScope(validationScope);
      expect(service.validationScope()).toEqual(validationScope);
    });

    it("#setValidationScopeWarningMessage should update the validation scope warning message", () => {
      service.setValidationScopeWarningMessage("message");
      expect(service.validationScopeWarningMessage()).toEqual("message");
    });
  });

  it("should signal configuration impacts correctly", async () => {
    const configurationImpact = {
      ...analysisObjectLink1,
      analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
    };
    jest
      .spyOn(analysisObjectLinkService, "fetch")
      .mockReturnValue(of([analysisObjectLink1, configurationImpact]));
    await lastValueFrom(service.initialize(scenarioExecutionId));
    expect(service.configurationImpactLinks()).toEqual([configurationImpact]);
  });

  it("should signal configuration regressions correctly", async () => {
    const configurationRegression = {
      ...analysisObjectLink1,
      analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
    };
    jest
      .spyOn(analysisObjectLinkService, "fetch")
      .mockReturnValue(of([analysisObjectLink1, configurationRegression]));
    await lastValueFrom(service.initialize(scenarioExecutionId));
    expect(service.configurationRegressionLinks()).toEqual([
      configurationRegression,
    ]);
  });

  it("should signal binary impacts correctly", async () => {
    const binaryImpact = {
      ...analysisObjectLink1,
      analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
    };
    jest
      .spyOn(analysisObjectLinkService, "fetch")
      .mockReturnValue(of([analysisObjectLink1, binaryImpact]));
    await lastValueFrom(service.initialize(scenarioExecutionId));
    expect(service.binaryImpactLinks()).toEqual([binaryImpact]);
  });

  it("should signal binary regressions correctly", async () => {
    const binaryRegression = {
      ...analysisObjectLink1,
      analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
    };
    jest
      .spyOn(analysisObjectLinkService, "fetch")
      .mockReturnValue(of([analysisObjectLink1, binaryRegression]));
    await lastValueFrom(service.initialize(scenarioExecutionId));
    expect(service.binaryRegressionLinks()).toEqual([binaryRegression]);
  });

  it("should signal incidents correctly", async () => {
    const incident = {
      ...analysisObjectLink1,
      analysisObjectType: AnalysisObjectType.INCIDENT,
    };
    jest
      .spyOn(analysisObjectLinkService, "fetch")
      .mockReturnValue(of([analysisObjectLink1, incident]));
    await lastValueFrom(service.initialize(scenarioExecutionId));
    expect(service.incidentLinks()).toEqual([incident]);
  });

  describe("update analysis object links", () => {
    it("update analysis object links updates the state with the new links on success", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
      ]);

      const updateRequest = {
        linksToAdd: [analysisObjectLink1],
        linksToRemove: [analysisObjectLink2],
      };
      jest
        .spyOn(analysisObjectLinkService, "update")
        .mockReturnValue(of(undefined));
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(of([analysisObjectLink1]));
      await lastValueFrom(service.updateAnalysisObjectsLinks(updateRequest));
      expect(service.analysisObjectLinks()).toEqual([analysisObjectLink1]);
    });

    it("should not fetch the links in case failed to update analysis object links", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
      ]);

      const updateRequest = {
        linksToAdd: [analysisObjectLink1],
        linksToRemove: [analysisObjectLink2],
      };
      jest
        .spyOn(analysisObjectLinkService, "update")
        .mockReturnValue(throwError(() => errorMessage));
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(of([analysisObjectLink1]));
      await expect(
        lastValueFrom(service.updateAnalysisObjectsLinks(updateRequest))
      ).rejects.toEqual(errorMessage);
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
      ]);
    });

    it("should call fetchTestUnitAnalysisObjectLinks when updating analysis object links", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));

      const updateRequest = {
        linksToAdd: [analysisObjectLink1],
        linksToRemove: [analysisObjectLink2],
      };
      jest
        .spyOn(analysisObjectLinkService, "update")
        .mockReturnValue(of(undefined));
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(of([analysisObjectLink1]));
      const fetchTestUnitLinksSpy = jest.spyOn(
        analysisObjectLinkService,
        "fetchTestUnitAnalysisObjectLinks"
      );

      await lastValueFrom(service.updateAnalysisObjectsLinks(updateRequest));

      expect(fetchTestUnitLinksSpy).toHaveBeenCalledWith(
        projectId,
        scenarioExecution.testUnitId
      );
    });
  });

  describe("create analysis object link", () => {
    it("create analysis object links updates the state with the new link on success", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
      ]);

      jest
        .spyOn(analysisObjectLinkService, "createLink")
        .mockReturnValue(of(undefined));
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(
          of([analysisObjectLink1, analysisObjectLink2, analysisObjectLink3])
        );
      await lastValueFrom(
        service.createAnalysisObjectLink(
          projectId,
          scenarioExecutionId,
          analysisObjectLink3
        )
      );
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
        analysisObjectLink3,
      ]);
    });

    it("should not fetch the links in case failed to create analysis object link", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
      ]);

      jest
        .spyOn(analysisObjectLinkService, "createLink")
        .mockReturnValue(throwError(() => errorMessage));
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(
          of([analysisObjectLink1, analysisObjectLink2, analysisObjectLink3])
        );
      await expect(
        lastValueFrom(
          service.createAnalysisObjectLink(
            projectId,
            scenarioExecutionId,
            analysisObjectLink3
          )
        )
      ).rejects.toEqual(errorMessage);
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
      ]);
    });

    it("should call fetchTestUnitAnalysisObjectLinks when creating analysis object link", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));

      jest
        .spyOn(analysisObjectLinkService, "createLink")
        .mockReturnValue(of(undefined));
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(
          of([analysisObjectLink1, analysisObjectLink2, analysisObjectLink3])
        );
      const fetchTestUnitLinksSpy = jest.spyOn(
        analysisObjectLinkService,
        "fetchTestUnitAnalysisObjectLinks"
      );

      await lastValueFrom(
        service.createAnalysisObjectLink(
          projectId,
          scenarioExecutionId,
          analysisObjectLink3
        )
      );

      expect(fetchTestUnitLinksSpy).toHaveBeenCalledWith(
        projectId,
        scenarioExecution.testUnitId
      );
    });
  });

  describe("Get analysis object links", () => {
    beforeEach(() => {
      service["_isUserAuthorizedToAccessAnalysisObjects"].set(true);
    });

    it("#getScenarioExecutionAnalysisObjectLinks$ should return an empty array if no analysis object links are found", async () => {
      jest.spyOn(analysisObjectLinkService, "fetch").mockReturnValue(of([]));
      await lastValueFrom(service.getScenarioExecutionAnalysisObjectLinks$());
      expect(service.analysisObjectLinks()).toEqual([]);
    });

    it("#getScenarioExecutionAnalysisObjectLinks$ should get the analysis object links of the scenario execution", async () => {
      await lastValueFrom(service.getScenarioExecutionAnalysisObjectLinks$());
      expect(service.analysisObjectLinks()).toEqual([
        analysisObjectLink1,
        analysisObjectLink2,
      ]);
    });

    it("#getScenarioExecutionAnalysisObjectLinks$ should fetch the linked incidents upon fetching the analysis object links", async () => {
      jest.spyOn(analysisObjectLinkService, "fetch").mockReturnValue(
        of([
          {
            ...analysisObjectLink1,
            analysisObjectType: AnalysisObjectType.INCIDENT,
          },
        ])
      );
      await lastValueFrom(service.getScenarioExecutionAnalysisObjectLinks$());
      expect(incidentService.fetchIncidentsByIds).toHaveBeenCalledWith([
        analysisObjectId1,
      ]);
      expect(service.linkedIncidents()).toEqual(incidents);
    });

    it("#getScenarioExecutionAnalysisObjectLinks$ should not fetch the analysis object links nor the incidents if not authorized to do so", async () => {
      service["_isUserAuthorizedToAccessAnalysisObjects"].set(false);
      await lastValueFrom(service.getScenarioExecutionAnalysisObjectLinks$());
      expect(service.analysisObjectLinks()).toEqual([]);
      expect(service.linkedIncidents()).toEqual([]);
      expect(analysisObjectLinkService.fetch).not.toHaveBeenCalled();
      expect(incidentService.fetchIncidentsByIds).not.toHaveBeenCalled();
    });
  });

  describe("refreshAnalysisObjectLinks$", () => {
    beforeEach(() => {
      service["_isUserAuthorizedToAccessAnalysisObjects"].set(true);
    });

    it("should call both getScenarioExecutionAnalysisObjectLinks$ and getTestUnitAnalysisObjectLinks$", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));

      const fetchSpy = jest.spyOn(analysisObjectLinkService, "fetch");
      const fetchTestUnitLinksSpy = jest.spyOn(
        analysisObjectLinkService,
        "fetchTestUnitAnalysisObjectLinks"
      );

      await lastValueFrom(service.refreshAnalysisObjectLinks$());

      expect(fetchSpy).toHaveBeenCalledWith(projectId, scenarioExecutionId);
      expect(fetchTestUnitLinksSpy).toHaveBeenCalledWith(
        projectId,
        scenarioExecution.testUnitId
      );
    });

    it("should return void after both fetches complete", async () => {
      await lastValueFrom(service.initialize(scenarioExecutionId));

      const testUnitLinks = [
        { testUnitId: "tu-1" } as TestUnitAnalysisObjectLink,
      ];
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(of([analysisObjectLink1]));
      jest
        .spyOn(analysisObjectLinkService, "fetchTestUnitAnalysisObjectLinks")
        .mockReturnValue(of(testUnitLinks));

      const result = await lastValueFrom(service.refreshAnalysisObjectLinks$());

      expect(result).toBeUndefined();
    });
  });

  describe("refreshSelectedScenarioExecution", () => {
    it("should refresh the selected scenario execution", async () => {
      const updatedScenarioExecution = {
        ...scenarioExecution,
        analysisStatus: ScenarioAnalysisStatus.FAILED,
      };
      jest
        .spyOn(scenarioExecutionService, "getScenarioExecution")
        .mockReturnValue(of(updatedScenarioExecution));
      service.refreshSelectedScenarioExecution$().subscribe();
      expect(service.scenarioExecution()).toEqual(updatedScenarioExecution);
    });

    it("should refresh the test unit of the scenario execution", async () => {
      const updatedTestUnit = {
        ...TEST_UNIT,
        assignee: "new assignee",
      };
      jest
        .spyOn(testUnitService, "fetchById")
        .mockReturnValue(of(updatedTestUnit));
      service.refreshSelectedScenarioExecution$().subscribe();
      expect(service.testUnit()).toEqual(updatedTestUnit);
    });

    it("should return an observable that completes after refreshing", async () => {
      jest
        .spyOn(scenarioExecutionService, "getScenarioExecution")
        .mockReturnValue(of(scenarioExecution));
      const result = await lastValueFrom(
        service.refreshSelectedScenarioExecution$()
      );
      expect(result).toBeUndefined();
    });
  });

  describe("filter analyzable links", () => {
    beforeEach(async () => {
      jest
        .spyOn(authorizationService, "isAuthorized")
        .mockReturnValue(of(true));
    });

    it("should include analysis object linked to analyzable test case executions", async () => {
      const analyzableTCE = { ...testCaseExecution1, analyzable: true };
      jest
        .spyOn(testCaseExecutionService, "fetch")
        .mockReturnValue(of([analyzableTCE]));
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(
          of([
            { ...analysisObjectLink1, testCaseExecutionId: analyzableTCE.id },
          ])
        );

      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([
        { ...analysisObjectLink1, testCaseExecutionId: analyzableTCE.id },
      ]);
    });

    it("should include scenario linked analysis objects", async () => {
      jest.spyOn(testCaseExecutionService, "fetch").mockReturnValue(of([]));
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(
          of([{ ...analysisObjectLink2, testCaseExecutionId: undefined }])
        );

      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([
        { ...analysisObjectLink2, testCaseExecutionId: undefined },
      ]);
    });

    it("should include analysis object if linked to both analyzable and non-analyzable test cases", async () => {
      const analyzableTCE = { ...testCaseExecution1, analyzable: true };
      const nonAnalyzableTCE = { ...testCaseExecution2, analyzable: false };
      jest
        .spyOn(testCaseExecutionService, "fetch")
        .mockReturnValue(of([analyzableTCE, nonAnalyzableTCE]));
      const linkToAnalyzable = {
        ...analysisObjectLink1,
        testCaseExecutionId: analyzableTCE.id,
      };
      const linkToNonAnalyzable = {
        ...analysisObjectLink1,
        testCaseExecutionId: nonAnalyzableTCE.id,
      };
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(of([linkToAnalyzable, linkToNonAnalyzable]));

      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([
        linkToAnalyzable,
        linkToNonAnalyzable,
      ]);
    });

    it("should include analysis object if linked to scenario and non-analyzable test case", async () => {
      const nonAnalyzableTCE = { ...testCaseExecution1, analyzable: false };
      jest
        .spyOn(testCaseExecutionService, "fetch")
        .mockReturnValue(of([nonAnalyzableTCE]));
      const scenarioLink = {
        ...analysisObjectLink1,
        testCaseExecutionId: undefined,
      };
      const tceLink = {
        ...analysisObjectLink1,
        testCaseExecutionId: nonAnalyzableTCE.id,
      };
      jest
        .spyOn(analysisObjectLinkService, "fetch")
        .mockReturnValue(of([scenarioLink, tceLink]));

      await lastValueFrom(service.initialize(scenarioExecutionId));
      expect(service.analysisObjectLinks()).toEqual([scenarioLink, tceLink]);
    });
  });

  it("should set the selected test case executions state", () => {
    expect(service.webReportSelectedTestCaseExecutions()).toEqual([]);
    const testCaseExecutions = [testCaseExecution1, testCaseExecution2];
    service.setWebReportSelectedTestCaseExecutions(testCaseExecutions);
    expect(service.webReportSelectedTestCaseExecutions()).toEqual(
      testCaseExecutions
    );
  });

  it("should set the web report currently viewed test case execution state", () => {
    expect(
      service.webReportCurrentlyViewedTestCaseExecution()
    ).not.toBeDefined();
    service.setWebReportCurrentlyViewedTestCaseExecution(testCaseExecution1);
    expect(service.webReportCurrentlyViewedTestCaseExecution()).toEqual(
      testCaseExecution1
    );
  });

  it("should set the selected test execution id state", () => {
    expect(service.currentlyViewedTestExecutionId()).toEqual(undefined);
    const testExecutionId = "test execution id";
    service.setCurrentlyViewedTestExecutionId(testExecutionId);
    expect(service.currentlyViewedTestExecutionId()).toEqual(testExecutionId);
  });

  describe("testCaseTestUnitAnalysisObjectLinksMap", () => {
    const createLink = (
      testCaseExternalId: string | undefined,
      analysisObjectId: string
    ): TestUnitAnalysisObjectLink => ({
      projectId: "proj-1",
      scenarioExecutionId: scenarioExecutionId,
      testUnitId: "test-unit",
      analysisObject: {
        id: analysisObjectId,
        title: "title",
        readableId: "readable-id",
        type: AnalysisObjectType.INCIDENT,
      },
      testCaseExecution: {
        id: "test-case-id",
        externalId: testCaseExternalId,
      },
    });

    it("should return an empty map when there are no links", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchTestUnitAnalysisObjectLinks")
        .mockReturnValue(of([]));

      await lastValueFrom(service.initialize(scenarioExecutionId));

      expect(service.testCaseTestUnitAnalysisObjectLinksMap().size).toBe(0);
    });

    it("should group links by testCaseExternalId", async () => {
      const link1 = createLink("TC-001", "ao-1");
      const link2 = createLink("TC-001", "ao-2");
      const link3 = createLink("TC-002", "ao-3");

      jest
        .spyOn(analysisObjectLinkService, "fetchTestUnitAnalysisObjectLinks")
        .mockReturnValue(of([link1, link2, link3]));

      await lastValueFrom(service.initialize(scenarioExecutionId));

      const map = service.testCaseTestUnitAnalysisObjectLinksMap();
      expect(map.size).toBe(2);
      expect(map.get("TC-001")).toEqual([link1, link2]);
      expect(map.get("TC-002")).toEqual([link3]);
    });

    it("should exclude links without test case execution", async () => {
      const linkWithId = createLink("TC-001", "ao-1");
      const linkWithoutId = {
        ...linkWithId,
        testCaseExecution: undefined,
      };

      jest
        .spyOn(analysisObjectLinkService, "fetchTestUnitAnalysisObjectLinks")
        .mockReturnValue(of([linkWithId, linkWithoutId]));

      await lastValueFrom(service.initialize(scenarioExecutionId));

      const map = service.testCaseTestUnitAnalysisObjectLinksMap();
      expect(map.size).toBe(1);
      expect(map.get("TC-001")).toEqual([linkWithId]);
    });

    it("should handle links with empty string testCaseExternalId as falsy", async () => {
      const linkWithEmptyId = createLink("", "ao-1");
      const linkWithValidId = createLink("TC-001", "ao-2");

      jest
        .spyOn(analysisObjectLinkService, "fetchTestUnitAnalysisObjectLinks")
        .mockReturnValue(of([linkWithEmptyId, linkWithValidId]));

      await lastValueFrom(service.initialize(scenarioExecutionId));

      const map = service.testCaseTestUnitAnalysisObjectLinksMap();
      expect(map.size).toBe(1);
      expect(map.has("")).toBe(false);
      expect(map.get("TC-001")).toEqual([linkWithValidId]);
    });
  });
});

const testCaseExecution3 = {
  id: "testCaseExecutionId3",
  projectId: "proj-125",
  testExecutionId: "exec-458",
  externalId: "ext-791",
  testCaseKey: "TC-003",
  functionalTestCaseId: "FTC-103",
  scenarioExecutionId: "SE-204",
  title: "Logout Test",
  description: "Test for user logout functionality",
  status: TestCaseExecutionStatus.PASSED,
  startDate: "2025-04-08T14:20:00.000Z",
  endDate: "2025-04-08T14:25:00.000Z",
} as TestCaseExecution;
