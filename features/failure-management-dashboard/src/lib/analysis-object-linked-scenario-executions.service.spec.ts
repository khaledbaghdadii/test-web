import { firstValueFrom, lastValueFrom, of } from "rxjs";
import { AnalysisObjectLinkedScenarioExecutionsService } from "./analysis-object-linked-scenario-executions.service";
import { Project, ProjectService } from "@mxflow/features/project";
import {
  AnalysisObjectLinkedScenarioExecution,
  AnalysisObjectLinkService,
  FetchTestCaseExecutionsRequest,
  ScenarioExecution,
  ScenarioExecutionBusinessProcess,
  ScenarioExecutionService,
  TestCaseExecution,
  TestCaseExecutionService,
} from "@mxflow/test-management";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { AnalysisObjectLinkedScenarioExecutionDetails } from "./model/analysis/analysis-object-linked-scenario-execution";
import { TestBed } from "@angular/core/testing";

const PROJECT_ID = "PROJECT_ID";
const PROJECT_ID2 = "PROJECT_ID2";
const PROJECT_NAME = "projectName";
const PROJECT_NAME2 = "projectName2";
const SCENARIO_DEFINITION_ID = "scenarioDefinitionId";
const SCENARIO_DEFINITION_ID2 = "scenarioDefinitionId2";
const SCENARIO_DEFINITION_NAME = "scenarioDefinitionName";
const SCENARIO_DEFINITION_NAME2 = "scenarioDefinitionName2";
const BUSINESS_PROCESS_EXECUTION_ID = "businessProcessExecutionId";
const BUSINESS_PROCESS_EXECUTION_ID2 = "businessProcessExecutionId2";
const BUSINESS_PROCESS_EXECUTION_ID3 = "businessProcessExecutionId3";
const BUSINESS_PROCESS_EXECUTION_ID4 = "businessProcessExecutionId4";
const BUSINESS_PROCESS_EXECUTION_NAME = "businessProcessExecutionName";
const BUSINESS_PROCESS_EXECUTION_NAME2 = "businessProcessExecutionName2";
const BUSINESS_PROCESS_EXECUTION_NAME3 = "businessProcessExecutionName3";
const BUSINESS_PROCESS_EXECUTION_NAME4 = "businessProcessExecutionName4";
const SCENARIO_EXECUTION_ID = "scenarioExecutionId";
const SCENARIO_EXECUTION_ID2 = "scenarioExecutionId2";
const ANALYSIS_OBJECT_ID = "ANALYSIS_OBJECT_ID";
const PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE = AnalysisObjectType.BINARY_IMPACT;
const GLOBAL_ANALYSIS_OBJECT_TYPE = AnalysisObjectType.BINARY_REGRESSION;
const LINKED_SCENARIO_EXECUTION_1: AnalysisObjectLinkedScenarioExecution = {
  scenarioExecutionId: SCENARIO_EXECUTION_ID,
  scenarioDefinitionId: SCENARIO_DEFINITION_ID,
  contextId: BUSINESS_PROCESS_EXECUTION_ID,
  projectId: PROJECT_ID,
};
const LINKED_SCENARIO_EXECUTION_2: AnalysisObjectLinkedScenarioExecution = {
  scenarioExecutionId: SCENARIO_EXECUTION_ID2,
  scenarioDefinitionId: SCENARIO_DEFINITION_ID2,
  contextId: BUSINESS_PROCESS_EXECUTION_ID2,
  projectId: PROJECT_ID2,
};
const LINKED_SCENARIO_EXECUTIONS: AnalysisObjectLinkedScenarioExecution[] = [
  LINKED_SCENARIO_EXECUTION_1,
  LINKED_SCENARIO_EXECUTION_2,
];
const LINKED_SCENARIO_EXECUTION_DETAILS_1: AnalysisObjectLinkedScenarioExecutionDetails =
  {
    scenarioExecutionId: SCENARIO_EXECUTION_ID,
    scenarioDefinitionName: SCENARIO_DEFINITION_NAME,
    businessProcesses: [
      {
        id: BUSINESS_PROCESS_EXECUTION_ID,
        name: BUSINESS_PROCESS_EXECUTION_NAME,
      },
      {
        id: BUSINESS_PROCESS_EXECUTION_ID2,
        name: BUSINESS_PROCESS_EXECUTION_NAME2,
      },
    ],
    project: {
      id: PROJECT_ID,
      name: PROJECT_NAME,
    },
    testCaseExecutions: [],
  };

const LINKED_SCENARIO_EXECUTION_DETAILS_2: AnalysisObjectLinkedScenarioExecutionDetails =
  {
    scenarioExecutionId: SCENARIO_EXECUTION_ID2,
    scenarioDefinitionName: SCENARIO_DEFINITION_NAME2,
    businessProcesses: [
      {
        id: BUSINESS_PROCESS_EXECUTION_ID3,
        name: BUSINESS_PROCESS_EXECUTION_NAME3,
      },
      {
        id: BUSINESS_PROCESS_EXECUTION_ID4,
        name: BUSINESS_PROCESS_EXECUTION_NAME4,
      },
    ],
    project: {
      id: PROJECT_ID2,
      name: PROJECT_NAME2,
    },
    testCaseExecutions: [],
  };

const LINKED_SCENARIO_EXECUTIONS_DETAILS: AnalysisObjectLinkedScenarioExecutionDetails[] =
  [LINKED_SCENARIO_EXECUTION_DETAILS_1, LINKED_SCENARIO_EXECUTION_DETAILS_2];

const project1: Project = {
  id: PROJECT_ID,
  name: PROJECT_NAME,
} as unknown as Project;

const project2: Project = {
  id: PROJECT_ID2,
  name: PROJECT_NAME2,
} as unknown as Project;

const businessProcessExecution1 = {
  id: BUSINESS_PROCESS_EXECUTION_ID,
  name: BUSINESS_PROCESS_EXECUTION_NAME,
} as unknown as ScenarioExecutionBusinessProcess;

const businessProcessExecution2 = {
  id: BUSINESS_PROCESS_EXECUTION_ID2,
  name: BUSINESS_PROCESS_EXECUTION_NAME2,
} as unknown as ScenarioExecutionBusinessProcess;

const businessProcessExecution3 = {
  id: BUSINESS_PROCESS_EXECUTION_ID3,
  name: BUSINESS_PROCESS_EXECUTION_NAME3,
} as unknown as ScenarioExecutionBusinessProcess;

const businessProcessExecution4 = {
  id: BUSINESS_PROCESS_EXECUTION_ID4,
  name: BUSINESS_PROCESS_EXECUTION_NAME4,
} as unknown as ScenarioExecutionBusinessProcess;

const scenarioExecution1 = {
  id: SCENARIO_DEFINITION_ID,
  name: SCENARIO_DEFINITION_NAME,
  businessProcesses: [businessProcessExecution1, businessProcessExecution2],
  project: project1,
} as unknown as ScenarioExecution;

const scenarioExecution2 = {
  id: SCENARIO_DEFINITION_ID2,
  name: SCENARIO_DEFINITION_NAME2,
  businessProcesses: [businessProcessExecution3, businessProcessExecution4],
  project: project2,
} as unknown as ScenarioExecution;

const TEST_CASE_EXECUTION_1 = {
  id: "testCaseExecutionId1",
  title: "testCaseExecutionName1",
  scenarioExecutionId: SCENARIO_EXECUTION_ID,
} as unknown as TestCaseExecution;

const TEST_CASE_EXECUTION_2 = {
  id: "testCaseExecutionId2",
  title: "testCaseExecutionName2",
  scenarioExecutionId: SCENARIO_EXECUTION_ID2,
} as unknown as TestCaseExecution;

const TEST_CASE_EXECUTION_3 = {
  id: "testCaseExecutionId3",
  title: "testCaseExecutionName3",
  scenarioExecutionId: SCENARIO_EXECUTION_ID2,
} as unknown as TestCaseExecution;

describe("AnalysisObjectLinkedScenarioExecutionsService", () => {
  let service: AnalysisObjectLinkedScenarioExecutionsService;
  let scenarioExecutionService: ScenarioExecutionService;
  let projectService: ProjectService;
  let analysisObjectLinkService: AnalysisObjectLinkService;
  let testCaseExecutionService: TestCaseExecutionService;

  beforeEach(() => {
    scenarioExecutionService = {
      getScenarioExecution: (projectId: string, id: string) => {
        if (id === SCENARIO_EXECUTION_ID && projectId === PROJECT_ID) {
          return of(scenarioExecution1);
        }
        if (id === SCENARIO_EXECUTION_ID2 && projectId === PROJECT_ID2) {
          return of(scenarioExecution2);
        }
        return of();
      },
    } as unknown as ScenarioExecutionService;

    projectService = {
      getProjectById: (projectId: string) => {
        if (projectId === PROJECT_ID) {
          return of(project1);
        }
        if (projectId === PROJECT_ID2) {
          return of(project2);
        }
        return of();
      },
    } as unknown as ProjectService;

    analysisObjectLinkService = {
      fetchProjectSpecificAnalysisObjectLinks: jest.fn(() =>
        of(LINKED_SCENARIO_EXECUTIONS)
      ),
      fetchGlobalAnalysisObjectLinks: jest.fn(() =>
        of(LINKED_SCENARIO_EXECUTIONS)
      ),
    } as unknown as AnalysisObjectLinkService;

    testCaseExecutionService = {
      fetchAnalyzableTestCaseExecutions: jest.fn(() => of([])),
    } as unknown as TestCaseExecutionService;

    TestBed.configureTestingModule({
      providers: [AnalysisObjectLinkedScenarioExecutionsService],
    })
      .overrideProvider(ScenarioExecutionService, {
        useValue: scenarioExecutionService,
      })
      .overrideProvider(ProjectService, { useValue: projectService })
      .overrideProvider(AnalysisObjectLinkService, {
        useValue: analysisObjectLinkService,
      })
      .overrideProvider(TestCaseExecutionService, {
        useValue: testCaseExecutionService,
      });
    service = TestBed.inject(AnalysisObjectLinkedScenarioExecutionsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("fetch project specific analysis object linked scenario executions", () => {
    it("should fetch project specific analysis object links", async () => {
      await lastValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );
      expect(
        analysisObjectLinkService.fetchProjectSpecificAnalysisObjectLinks
      ).toHaveBeenCalledTimes(1);
      expect(
        analysisObjectLinkService.fetchProjectSpecificAnalysisObjectLinks
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        ANALYSIS_OBJECT_ID,
        PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
      );
    });

    it("should return an empty array if no links to the project-specific detection exist", async () => {
      jest
        .spyOn(
          analysisObjectLinkService,
          "fetchProjectSpecificAnalysisObjectLinks"
        )
        .mockReturnValue(of([]));

      const data = await firstValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(data).toEqual([]);
    });

    it("should remove all duplicates from response", async () => {
      jest
        .spyOn(
          analysisObjectLinkService,
          "fetchProjectSpecificAnalysisObjectLinks"
        )
        .mockReturnValue(
          of([LINKED_SCENARIO_EXECUTION_1, LINKED_SCENARIO_EXECUTION_1])
        );

      const data = await lastValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );
      expect(data).toMatchObject([LINKED_SCENARIO_EXECUTION_DETAILS_1]);
    });

    it("should not remove unique scenario executions from response", async () => {
      const data = await lastValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );
      expect(data.sort()).toMatchObject(
        LINKED_SCENARIO_EXECUTIONS_DETAILS.sort()
      );
    });

    it("should fetch the test case executions linked to each unique scenario execution", async () => {
      jest
        .spyOn(
          analysisObjectLinkService,
          "fetchProjectSpecificAnalysisObjectLinks"
        )
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_1.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_2.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_2,
              testCaseExecutionId: TEST_CASE_EXECUTION_3.id,
            },
          ])
        );

      const firstFetchRequest: FetchTestCaseExecutionsRequest = {
        projectId: LINKED_SCENARIO_EXECUTION_1.projectId,
        params: {
          testCaseExecutionIds: [
            TEST_CASE_EXECUTION_1.id,
            TEST_CASE_EXECUTION_2.id,
          ],
        },
      };
      const secondFetchRequest: FetchTestCaseExecutionsRequest = {
        projectId: LINKED_SCENARIO_EXECUTION_2.projectId,
        params: {
          testCaseExecutionIds: [TEST_CASE_EXECUTION_3.id],
        },
      };

      await firstValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledTimes(2);
      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledWith(firstFetchRequest);
      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledWith(secondFetchRequest);
    });

    it("should only fetch the test case execution of the transitive link if the project-specific detection has a direct and transitive link to the scenario execution", async () => {
      jest
        .spyOn(
          analysisObjectLinkService,
          "fetchProjectSpecificAnalysisObjectLinks"
        )
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_1.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: undefined,
            },
          ])
        );

      const fetchRequest: FetchTestCaseExecutionsRequest = {
        projectId: LINKED_SCENARIO_EXECUTION_1.projectId,
        params: {
          testCaseExecutionIds: [TEST_CASE_EXECUTION_1.id],
        },
      };

      await firstValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledTimes(1);
      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledWith(fetchRequest);
    });

    it("should not fetch test case executions if the project-specific detection is not linked to test cases", async () => {
      jest
        .spyOn(
          analysisObjectLinkService,
          "fetchProjectSpecificAnalysisObjectLinks"
        )
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: undefined,
            },
          ])
        );

      await firstValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).not.toHaveBeenCalled();
    });

    it("should return the names of the linked test cases for each unique scenario execution", async () => {
      jest
        .spyOn(
          analysisObjectLinkService,
          "fetchProjectSpecificAnalysisObjectLinks"
        )
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_1.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_2.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_2,
              testCaseExecutionId: TEST_CASE_EXECUTION_3.id,
            },
          ])
        );

      jest
        .spyOn(testCaseExecutionService, "fetchAnalyzableTestCaseExecutions")
        .mockReturnValueOnce(of([TEST_CASE_EXECUTION_1, TEST_CASE_EXECUTION_2]))
        .mockReturnValueOnce(of([TEST_CASE_EXECUTION_3]));

      const data = await firstValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(data).toEqual([
        {
          ...LINKED_SCENARIO_EXECUTION_DETAILS_1,
          testCaseExecutions: [TEST_CASE_EXECUTION_1, TEST_CASE_EXECUTION_2],
        },
        {
          ...LINKED_SCENARIO_EXECUTION_DETAILS_2,
          testCaseExecutions: [TEST_CASE_EXECUTION_3],
        },
      ]);
    });

    it("should not include the test case name if the test case execution id doesnt exist", async () => {
      jest
        .spyOn(
          analysisObjectLinkService,
          "fetchProjectSpecificAnalysisObjectLinks"
        )
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: "rogueTestCase",
            },
          ])
        );

      jest
        .spyOn(testCaseExecutionService, "fetchAnalyzableTestCaseExecutions")
        .mockReturnValueOnce(of([]));

      const data = await firstValueFrom(
        service.getProjectSpecificAnalysisObjectLinks(
          PROJECT_ID,
          ANALYSIS_OBJECT_ID,
          PROJECT_SPECIFIC_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(data).toEqual([
        {
          ...LINKED_SCENARIO_EXECUTION_DETAILS_1,
          testCaseExecutions: [],
        },
      ]);
    });
  });

  describe("fetch global analysis object linked scenario execution", () => {
    it("should fetch global analysis object links", async () => {
      await lastValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(
        analysisObjectLinkService.fetchGlobalAnalysisObjectLinks
      ).toHaveBeenCalledTimes(1);
      expect(
        analysisObjectLinkService.fetchGlobalAnalysisObjectLinks
      ).toHaveBeenCalledWith(ANALYSIS_OBJECT_ID, GLOBAL_ANALYSIS_OBJECT_TYPE);
    });

    it("should remove all duplicate scenario executions from response", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchGlobalAnalysisObjectLinks")
        .mockReturnValue(
          of([LINKED_SCENARIO_EXECUTION_1, LINKED_SCENARIO_EXECUTION_1])
        );

      const data = await firstValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(data).toMatchObject([LINKED_SCENARIO_EXECUTION_DETAILS_1]);
    });

    it("should return an empty array if no links to the global detection exist", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchGlobalAnalysisObjectLinks")
        .mockReturnValue(of([]));

      const data = await firstValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(data).toEqual([]);
    });

    it("should not remove unique scenario executions from response", async () => {
      const data = await lastValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );
      expect(data).toMatchObject(LINKED_SCENARIO_EXECUTIONS_DETAILS.sort());
    });

    it("should fetch the test case executions linked to each unique scenario execution", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchGlobalAnalysisObjectLinks")
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_1.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_2.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_2,
              testCaseExecutionId: TEST_CASE_EXECUTION_3.id,
            },
          ])
        );

      const firstFetchRequest: FetchTestCaseExecutionsRequest = {
        projectId: LINKED_SCENARIO_EXECUTION_1.projectId,
        params: {
          testCaseExecutionIds: [
            TEST_CASE_EXECUTION_1.id,
            TEST_CASE_EXECUTION_2.id,
          ],
        },
      };
      const secondFetchRequest: FetchTestCaseExecutionsRequest = {
        projectId: LINKED_SCENARIO_EXECUTION_2.projectId,
        params: {
          testCaseExecutionIds: [TEST_CASE_EXECUTION_3.id],
        },
      };

      await firstValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledTimes(2);
      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledWith(firstFetchRequest);
      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledWith(secondFetchRequest);
    });

    it("should only fetch the test case execution of the transitive link if the global detection has a direct and transitive link to the scenario execution", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchGlobalAnalysisObjectLinks")
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_1.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: undefined,
            },
          ])
        );

      const fetchRequest: FetchTestCaseExecutionsRequest = {
        projectId: LINKED_SCENARIO_EXECUTION_1.projectId,
        params: {
          testCaseExecutionIds: [TEST_CASE_EXECUTION_1.id],
        },
      };

      await firstValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledTimes(1);
      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).toHaveBeenCalledWith(fetchRequest);
    });

    it("should not fetch test case executions if the global detection is not linked to test cases", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchGlobalAnalysisObjectLinks")
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: undefined,
            },
          ])
        );

      await firstValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(
        testCaseExecutionService.fetchAnalyzableTestCaseExecutions
      ).not.toHaveBeenCalled();
    });

    it("should return the names of the linked test cases for each unique scenario execution", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchGlobalAnalysisObjectLinks")
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_1.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: TEST_CASE_EXECUTION_2.id,
            },
            {
              ...LINKED_SCENARIO_EXECUTION_2,
              testCaseExecutionId: TEST_CASE_EXECUTION_3.id,
            },
          ])
        );

      jest
        .spyOn(testCaseExecutionService, "fetchAnalyzableTestCaseExecutions")
        .mockReturnValueOnce(of([TEST_CASE_EXECUTION_1, TEST_CASE_EXECUTION_2]))
        .mockReturnValueOnce(of([TEST_CASE_EXECUTION_3]));

      const data = await firstValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(data).toEqual([
        {
          ...LINKED_SCENARIO_EXECUTION_DETAILS_1,
          testCaseExecutions: [TEST_CASE_EXECUTION_1, TEST_CASE_EXECUTION_2],
        },
        {
          ...LINKED_SCENARIO_EXECUTION_DETAILS_2,
          testCaseExecutions: [TEST_CASE_EXECUTION_3],
        },
      ]);
    });

    it("should not include the test case name if the test case execution id doesnt exist", async () => {
      jest
        .spyOn(analysisObjectLinkService, "fetchGlobalAnalysisObjectLinks")
        .mockReturnValue(
          of([
            {
              ...LINKED_SCENARIO_EXECUTION_1,
              testCaseExecutionId: "rogueTestCase",
            },
          ])
        );

      jest
        .spyOn(testCaseExecutionService, "fetchAnalyzableTestCaseExecutions")
        .mockReturnValueOnce(of([]));

      const data = await firstValueFrom(
        service.getGlobalAnalysisObjectLinks(
          ANALYSIS_OBJECT_ID,
          GLOBAL_ANALYSIS_OBJECT_TYPE
        )
      );

      expect(data).toEqual([
        {
          ...LINKED_SCENARIO_EXECUTION_DETAILS_1,
          testCaseExecutions: [],
        },
      ]);
    });
  });
});
