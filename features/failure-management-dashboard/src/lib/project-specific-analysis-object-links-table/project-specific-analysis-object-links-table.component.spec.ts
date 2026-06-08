import { ProjectSpecificAnalysisObjectLinksTableComponent } from "./project-specific-analysis-object-links-table.component";
import { of } from "rxjs";
import { AnalysisObjectLinkedScenarioExecutionsService } from "../analysis-object-linked-scenario-executions.service";
import { AnalysisObjectLinkedScenarioExecutionDetails } from "../model/analysis/analysis-object-linked-scenario-execution";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import {
  DefaultRenderComponent,
  MockBuilder,
  MockedComponentFixture,
  MockRender,
} from "ng-mocks";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";
import { TestCaseExecution } from "@mxflow/test-management";

describe("ProjectSpecificAnalysisObjectLinksTableComponent", () => {
  const ANALYSIS_OBJECT_ID = "analysisObjectId";
  const ANALYSIS_OBJECT_TYPE = AnalysisObjectType.BINARY_IMPACT;
  const PROJECT_ID = "projectId";
  const SCENARIO_EXECUTION_ID = "scenarioExecutionId";
  const SCENARIO_DEFINITION_NAME = "scenarioDefinitionName";
  const CONTEXT_ID = "contextId";
  const EXECUTION_NAME = "bpExecutionName";
  const PROJECT_NAME = "projectName";
  const TEST_CASE_EXECUTION_NAME_1 = "TC 1";
  const TEST_CASE_EXECUTION_NAME_2 = "TC 2";

  let component: ProjectSpecificAnalysisObjectLinksTableComponent;
  let fixture: MockedComponentFixture<ProjectSpecificAnalysisObjectLinksTableComponent>;
  let linksService: AnalysisObjectLinkedScenarioExecutionsService;

  beforeEach(async () => {
    linksService = {
      getProjectSpecificAnalysisObjectLinks: jest.fn(() =>
        of(getDashboardItems())
      ),
    } as unknown as AnalysisObjectLinkedScenarioExecutionsService;

    const params = {
      projectId: PROJECT_ID,
      analysisObjectId: ANALYSIS_OBJECT_ID,
      analysisObjectType: ANALYSIS_OBJECT_TYPE,
    } as unknown as DefaultRenderComponent<ProjectSpecificAnalysisObjectLinksTableComponent>;

    await MockBuilder(ProjectSpecificAnalysisObjectLinksTableComponent)
      .keep(TableModule)
      .keep(CommonModule)
      .keep(TooltipModule)
      .mock(AnalysisObjectLinkedScenarioExecutionsService, linksService);

    fixture = MockRender(
      ProjectSpecificAnalysisObjectLinksTableComponent,
      params
    );
    component = fixture.point.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should fetch linked scenario executions from detections dashboard service", () => {
      component.ngOnInit();

      expect(
        linksService.getProjectSpecificAnalysisObjectLinks
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        ANALYSIS_OBJECT_ID,
        ANALYSIS_OBJECT_TYPE
      );
      expect(component.linkedScenarioExecutions).toEqual(getDashboardItems());
    });

    it("should stop loading after fetching linked scenario executions", () => {
      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });

    it("should emit error message on failure to fetch linked scenario executions", () => {
      jest.spyOn(component.errorMessageEmitter, "emit");

      component.ngOnInit();

      expect(component.errorMessageEmitter.emit).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  });

  it("should destroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  function getDashboardItems(): AnalysisObjectLinkedScenarioExecutionDetails[] {
    return [
      {
        scenarioExecutionId: SCENARIO_EXECUTION_ID,
        scenarioDefinitionName: SCENARIO_DEFINITION_NAME,
        businessProcesses: [
          {
            id: CONTEXT_ID,
            name: EXECUTION_NAME,
          },
        ],
        project: {
          id: PROJECT_ID,
          name: PROJECT_NAME,
        },
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
