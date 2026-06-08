import { BuildAndTestActionsComponent } from "./build-and-test-actions.component";
import {
  BuildAndTestProcessBuildAndTestStage,
  BuildAndTestProcessStageStatus,
} from "@mxflow/features/business-process";
import { EventEmitter, NO_ERRORS_SCHEMA } from "@angular/core";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CiProcessExecutionStateUpdaterService } from "../../../ci-process-execution-details/ci-process-state-updater.service";
import { MergeRequest } from "@mxflow/features/scm-management";

describe("Build And Test action component", () => {
  const PROJECT_ID = "projectId";
  const CI_PROCESS_EXECUTION_ID = "executionId";

  let component: BuildAndTestActionsComponent;
  let ciProcessExecutionStateUpdaterService: jest.Mocked<
    Partial<CiProcessExecutionStateUpdaterService>
  >;
  let projectIdResolver: jest.Mocked<
    Partial<ProjectIdRouteParamsResolverService>
  >;
  let showModalEventEmitter: EventEmitter<void>;
  let hideModalEventEmitter: EventEmitter<void>;

  beforeEach(() => {
    ciProcessExecutionStateUpdaterService = {
      reloadProcessDetails: jest.fn(),
    };

    projectIdResolver = {
      resolve: jest.fn().mockReturnValue(PROJECT_ID),
    };

    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [BuildAndTestActionsComponent],
      providers: [
        {
          provide: CiProcessExecutionStateUpdaterService,
          useValue: ciProcessExecutionStateUpdaterService,
        },
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: projectIdResolver,
        },
      ],
    });

    component = TestBed.runInInjectionContext(
      () => new BuildAndTestActionsComponent()
    );

    showModalEventEmitter = component.showModalEventEmitter;
    hideModalEventEmitter = component.hideModalEventEmitter;

    component.buildAndTestStage = {} as BuildAndTestProcessBuildAndTestStage;
    component.ciProcessExecutionId = CI_PROCESS_EXECUTION_ID;

    component.ngOnInit();
  });

  describe("On init", () => {
    it("given the component is initialized when it loads then the project id is resolved from the url", () => {
      expect(projectIdResolver.resolve).toHaveBeenCalled();
      expect(component.projectId).toBe(PROJECT_ID);
    });
  });

  describe("Create New Merge Request Button", () => {
    it("given the user clicks create merge request when the button is clicked then a show modal event is emitted", () => {
      jest.spyOn(showModalEventEmitter, "emit");

      component.createMergeRequest();

      expect(showModalEventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe("when the user creates a merge request", () => {
    it("given the merge request is created when the modal confirms then the modal is hidden", () => {
      jest.spyOn(hideModalEventEmitter, "emit");

      component.mergeRequestCreated();

      expect(hideModalEventEmitter.emit).toHaveBeenCalled();
    });

    it("given the merge request is created when the modal confirms then the process state is refreshed", () => {
      component.mergeRequestCreated();

      expect(
        ciProcessExecutionStateUpdaterService.reloadProcessDetails
      ).toHaveBeenCalledWith(CI_PROCESS_EXECUTION_ID, PROJECT_ID);
    });
  });

  describe("when the merge request is reopened", () => {
    it("given a reopenable merge request when the reopen event is emitted then the process state is refreshed", () => {
      component.mergeRequestReopened();

      expect(
        ciProcessExecutionStateUpdaterService.reloadProcessDetails
      ).toHaveBeenCalledWith(CI_PROCESS_EXECUTION_ID, PROJECT_ID);
    });
  });

  describe("Action buttons visibility", () => {
    it("given there is a merge request and it is reopenable then it should only show reopen merge request button", () => {
      const fixture: ComponentFixture<BuildAndTestActionsComponent> =
        TestBed.createComponent(BuildAndTestActionsComponent);
      const fixtureComponent = fixture.componentInstance;
      fixtureComponent.buildAndTestStage =
        {} as BuildAndTestProcessBuildAndTestStage;
      fixtureComponent.ciProcessExecutionId = CI_PROCESS_EXECUTION_ID;
      fixtureComponent.mergeRequestDetails = {
        id: "mr-id",
        isReOpenable: true,
      } as unknown as MergeRequest;

      fixture.detectChanges();

      const reopenElement = fixture.nativeElement.querySelector(
        "mxevolve-ci-process-merge-request-reopen"
      );
      const createNewMergeRequestElement = fixture.nativeElement.querySelector(
        "#create-new-merge-request"
      );
      expect(reopenElement).toBeTruthy();
      expect(createNewMergeRequestElement).toBeFalsy();
    });
    it("given there is not merge request then it should only show create new merge request button", () => {
      const fixture: ComponentFixture<BuildAndTestActionsComponent> =
        TestBed.createComponent(BuildAndTestActionsComponent);
      const fixtureComponent = fixture.componentInstance;
      fixtureComponent.buildAndTestStage =
        {} as BuildAndTestProcessBuildAndTestStage;
      fixtureComponent.ciProcessExecutionId = CI_PROCESS_EXECUTION_ID;
      fixtureComponent.mergeRequestDetails = null;

      fixture.detectChanges();

      const reopenElement = fixture.nativeElement.querySelector(
        "mxevolve-ci-process-merge-request-reopen"
      );
      const createNewMergeRequestElement = fixture.nativeElement.querySelector(
        "#create-new-merge-request"
      );
      expect(createNewMergeRequestElement).toBeTruthy();
      expect(reopenElement).toBeFalsy();
    });
    it("given there is a merge request and it is not reopenable then it should only show create new merge request button", () => {
      const fixture: ComponentFixture<BuildAndTestActionsComponent> =
        TestBed.createComponent(BuildAndTestActionsComponent);
      const fixtureComponent = fixture.componentInstance;
      fixtureComponent.buildAndTestStage =
        {} as BuildAndTestProcessBuildAndTestStage;
      fixtureComponent.ciProcessExecutionId = CI_PROCESS_EXECUTION_ID;
      fixtureComponent.mergeRequestDetails = {
        id: "mr-id",
        isReOpenable: false,
      } as unknown as MergeRequest;

      fixture.detectChanges();

      const reopenElement = fixture.nativeElement.querySelector(
        "mxevolve-ci-process-merge-request-reopen"
      );
      const createNewMergeRequestElement = fixture.nativeElement.querySelector(
        "#create-new-merge-request"
      );
      expect(createNewMergeRequestElement).toBeTruthy();
      expect(reopenElement).toBeFalsy();
    });
    it("given the stage is not active when the component loads then the action buttons are disabled", () => {
      component.buildAndTestStage = {
        status: BuildAndTestProcessStageStatus.PASSED,
      } as unknown as BuildAndTestProcessBuildAndTestStage;
      component.ngOnInit();

      expect(component.actionsNotAllowed).toBe(true);
    });

    it("given the stage is active when the component loads then the action buttons are enabled", () => {
      component.buildAndTestStage = {
        status: BuildAndTestProcessStageStatus.PENDING_INPUT,
      } as unknown as BuildAndTestProcessBuildAndTestStage;
      component.ngOnInit();

      expect(component.actionsNotAllowed).toBe(false);
    });
  });
});
