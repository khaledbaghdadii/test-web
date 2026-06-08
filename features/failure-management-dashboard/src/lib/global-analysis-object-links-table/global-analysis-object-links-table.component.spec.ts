import { of, throwError } from "rxjs";
import { AnalysisObjectLinkedScenarioExecutionsService } from "../analysis-object-linked-scenario-executions.service";
import { AnalysisObjectLinkedScenarioExecutionDetails } from "../model/analysis/analysis-object-linked-scenario-execution";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { GlobalAnalysisObjectLinksTableComponent } from "./global-analysis-object-links-table.component";
import {
  DefaultRenderComponent,
  MockBuilder,
  MockedComponentFixture,
  MockRender,
} from "ng-mocks";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { TestCaseExecution } from "@mxflow/test-management";

describe("GlobalAnalysisObjectLinksTableComponent", () => {
  const PROJECT_ID = "projectId";
  const ANALYSIS_OBJECT_ID = "analysisObjectId";
  const ANALYSIS_OBJECT_TYPE = AnalysisObjectType.BINARY_REGRESSION;
  const TEST_CASE_EXECUTION_NAME_1 = "TC 1";
  const TEST_CASE_EXECUTION_NAME_2 = "TC 2";

  let component: GlobalAnalysisObjectLinksTableComponent;
  let fixture: MockedComponentFixture<GlobalAnalysisObjectLinksTableComponent>;
  let linksService: AnalysisObjectLinkedScenarioExecutionsService;

  beforeEach(async () => {
    linksService = {
      getGlobalAnalysisObjectLinks: jest.fn(() =>
        of(getScenarioExecutionLinks())
      ),
    } as unknown as AnalysisObjectLinkedScenarioExecutionsService;

    const params = {
      projectId: PROJECT_ID,
      analysisObjectId: ANALYSIS_OBJECT_ID,
      analysisObjectType: ANALYSIS_OBJECT_TYPE,
    } as unknown as DefaultRenderComponent<GlobalAnalysisObjectLinksTableComponent>;

    await MockBuilder(GlobalAnalysisObjectLinksTableComponent)
      .keep(CommonModule)
      .keep(TableModule)
      .keep(TooltipModule)
      .mock(AnalysisObjectLinkedScenarioExecutionsService, linksService);

    fixture = MockRender(GlobalAnalysisObjectLinksTableComponent, params);
    component = fixture.point.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should fetch linked scenario executions using the scenario detections dashboard service", () => {
      component.ngOnInit();

      expect(linksService.getGlobalAnalysisObjectLinks).toHaveBeenCalledWith(
        ANALYSIS_OBJECT_ID,
        ANALYSIS_OBJECT_TYPE
      );
      expect(component.linkedScenarioExecutions).toEqual(
        getScenarioExecutionLinks()
      );
    });

    it("should stop loading after fetching linked scenario executions", () => {
      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });

    it("should emit error if fetching links fails", () => {
      jest.spyOn(component.errorMessageEmitter, "emit");
      jest
        .spyOn(linksService, "getGlobalAnalysisObjectLinks")
        .mockReturnValue(throwError(() => new Error("error fetching links")));

      component.ngOnInit();

      expect(component.errorMessageEmitter.emit).toHaveBeenCalledWith(
        "error fetching links"
      );
    });
  });

  it("should destroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  function getScenarioExecutionLinks(): AnalysisObjectLinkedScenarioExecutionDetails[] {
    return [
      {
        scenarioExecutionId: "scenarioExecutionId",
        businessProcesses: [
          {
            id: "contextId",
            name: "execution name",
          },
        ],
        project: {
          id: "projectId",
          name: "project name",
        },
        scenarioDefinitionName: "scenario definition name",
        testCaseExecutions: [
          {
            title: TEST_CASE_EXECUTION_NAME_1,
            functionalTestCaseId: "functionalTestCaseId1",
          },
          {
            title: TEST_CASE_EXECUTION_NAME_2,
            functionalTestCaseId: "functionalTestCaseId2",
          },
        ] as TestCaseExecution[],
      },
      {
        scenarioExecutionId: "scenarioExecutionId2",
        businessProcesses: [
          {
            id: "contextId2",
            name: "execution name 2",
          },
        ],
        project: {
          id: "projectId2",
          name: "project name 2",
        },
        scenarioDefinitionName: "scenario definition name 2",
        testCaseExecutions: [
          {
            title: TEST_CASE_EXECUTION_NAME_1,
            functionalTestCaseId: "functionalTestCaseId1",
          },
          {
            title: TEST_CASE_EXECUTION_NAME_2,
            functionalTestCaseId: "functionalTestCaseId2",
          },
        ] as TestCaseExecution[],
      },
    ];
  }
});
