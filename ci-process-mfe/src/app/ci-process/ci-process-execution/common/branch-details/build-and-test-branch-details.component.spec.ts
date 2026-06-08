import { Store } from "@ngrx/store";
import { BuildAndTestBranchDetailsComponent } from "./build-and-test-branch-details.component";
import { concatMap, interval, merge, of, Subject } from "rxjs";
import { fakeAsync } from "@angular/core/testing";
import {
  BuildAndTestProcessCreateBranchStage,
  BuildAndTestProcessExecution,
  BuildAndTestProcessExecutionInput,
} from "@mxflow/features/business-process";
import { MockBuilder, MockRender, ngMocks } from "ng-mocks";
import { IssueTrackingService } from "@mxflow/features/project";

const processId = "processId";
const repositoryId = "repositoryId";
const DEVELOPMENT_ID = "developmentId";
const PROJECT_ID = "projectId";

describe("Branch Details Component Test", () => {
  let storeMock: Partial<Store>;
  let issueTrackingServiceMock: Partial<IssueTrackingService>;

  beforeEach(() => {
    storeMock = {
      pipe: jest.fn().mockReturnValue(of(getCiProcess())),
    } as Partial<Store>;

    issueTrackingServiceMock = {
      getJiraDetails: jest
        .fn()
        .mockReturnValue(of({ jiraBaseUrl: "https://jira.example.com" })),
    };

    return MockBuilder(BuildAndTestBranchDetailsComponent)
      .mock(Store, storeMock)
      .mock(IssueTrackingService, issueTrackingServiceMock);
  });

  it("should display the branch details correctly", () => {
    const fixture = MockRender(BuildAndTestBranchDetailsComponent, {
      projectId: PROJECT_ID,
      developmentId: DEVELOPMENT_ID,
    });
    const component = fixture.point.componentInstance;

    expect(component.ciProcessExecutionId).toStrictEqual(processId);
    expect(component.userStoryIds).toStrictEqual(
      getCiProcess().input.userStoryIds
    );
    expect(component.fallbackDevelopmentId).toEqual(DEVELOPMENT_ID);
    expect(component.repositoryId).toEqual(repositoryId);
    expect(component.jiraBaseUrl$).toBeDefined();
    component.jiraBaseUrl$.subscribe((response) => {
      expect(response.jiraBaseUrl).toEqual("https://jira.example.com");
    });
  });

  it("should unsubscribe to observables that outlive the component", fakeAsync(() => {
    const observable2 = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    const subject = new Subject();
    const executionObservable = merge(subject, observable2);

    const storeSpy = ngMocks.findInstance(Store);
    jest.spyOn(storeSpy, "pipe").mockReturnValue(executionObservable);

    const fixture = MockRender(BuildAndTestBranchDetailsComponent, {
      projectId: PROJECT_ID,
      developmentId: DEVELOPMENT_ID,
    });
    const component = fixture.point.componentInstance;

    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  }));
});

function getCiProcess(): BuildAndTestProcessExecution {
  return {
    id: processId,
    input: getCiProcessInput(),
    createBranchStage: {
      repositoryId,
      developmentId: DEVELOPMENT_ID,
    } as BuildAndTestProcessCreateBranchStage,
  } as BuildAndTestProcessExecution;
}

function getCiProcessInput(): BuildAndTestProcessExecutionInput {
  return {
    configurationBranchName: "configurationBranchName",
    configurationParentBranch: "configurationParentBranch",
    repositoryId: "repositoryId",
    userStoryIds: ["storyId"],
    buildAndTestInfraGroup: "buildAndTestInfraGroup",
    buildEnvironment: {
      skipEnvironmentDeployment: false,
      scenarioDefinitionId: "buildEnvironmentDefinition",
    },
    buildEnvironmentInfraGroup: "buildEnvironmentInfraGroup",
  };
}
