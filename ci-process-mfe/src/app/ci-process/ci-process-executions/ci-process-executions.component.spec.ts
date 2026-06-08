import { of } from "rxjs";
import { CiProcessExecutionsComponent } from "./ci-process-executions.component";
import { CiProcessExecutionsQuery } from "./models/ci-process-execution-query";
import {
  CiProcessExecutionsQueryResult,
  CiProcessExecutionSummary,
} from "./models/ci-process-execution-query-result";
import { BusinessProcessExecutionStatus } from "@mxflow/features/business-process";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

describe("[CiProcessExecutionsComponent] component test", () => {
  const PROJECT_ID = "PROJECT_ID";
  let component: CiProcessExecutionsComponent;

  let storeMock: any;
  let ciProcessExecutionsServiceMock: any;
  let businessProcessDefinitionServiceMock: any;
  let projectIdResolver: ProjectIdRouteParamsResolverService;

  beforeEach(() => {
    projectIdResolver = {
      resolve: jest.fn(() => PROJECT_ID),
    } as unknown as ProjectIdRouteParamsResolverService;
    storeMock = {
      select: jest.fn(),
    };
    ciProcessExecutionsServiceMock = {
      getCiProcessExecutions: jest.fn(),
    };
    businessProcessDefinitionServiceMock = {
      getBusinessProcessDefinitions: jest.fn(() => of()),
    };

    component = new CiProcessExecutionsComponent(
      storeMock,
      ciProcessExecutionsServiceMock,
      businessProcessDefinitionServiceMock,
      projectIdResolver
    );
  });

  it("should init component and handle pagination param change correctly", () => {
    let getCiProcessExecutionsServiceSpy = jest.spyOn(
      ciProcessExecutionsServiceMock,
      "getCiProcessExecutions"
    );

    getCiProcessExecutionsServiceSpy.mockReturnValue(
      of(TestUtil.getCiProcessExecutionsQueryResult())
    );

    const query: CiProcessExecutionsQuery = {
      page: 0,
      pageSize: 10,
    };

    component.ngOnInit();
    component.handlePaginationParamsChange(query);

    expect(component.projectId).toEqual(PROJECT_ID);
    expect(getCiProcessExecutionsServiceSpy).toHaveBeenCalledWith(
      PROJECT_ID,
      query
    );
    expect(component.total).toEqual(12);
    expect(component.executions).toEqual(
      TestUtil.getCiProcessExecutionSummary()
    );
  });

  it("should fetch business process definitions and save result in field", () => {
    businessProcessDefinitionServiceMock.getBusinessProcessDefinitions =
      jest.fn(() => of([{ processName: "process 1" }]));
    component.ngOnInit();
    expect(component.businessProcessDefinitions).toEqual([
      { processName: "process 1" },
    ]);
  });
});

class TestUtil {
  static getCiProcessExecutionsQueryResult(): CiProcessExecutionsQueryResult {
    return {
      content: this.getCiProcessExecutionSummary(),
      totalElements: 12,
    };
  }

  static getCiProcessExecutionSummary(): CiProcessExecutionSummary[] {
    return [
      {
        businessProcessDefinitionName: "businessProcessDefinitionName",
        processName: "process name",
        configurationBranchName: "configurationBranchName",
        endDate: "endDate",
        expiryDate: "expiryDate",
        daysExtended: 9,
        id: "id",
        name: "name",
        owner: "owner",
        startDate: "startDate",
        status: BusinessProcessExecutionStatus.PASSED,
        userStoryIds: ["userStoryId"],
      },
    ];
  }
}
