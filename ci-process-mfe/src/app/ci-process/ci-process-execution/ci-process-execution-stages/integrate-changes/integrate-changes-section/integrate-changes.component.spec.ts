import { IntegrateChangesComponent } from "./integrate-changes.component";
import { CiProcessExecutionStateUpdaterService } from "../../../ci-process-execution-details/ci-process-state-updater.service";
import { MergeRequestViewComponent } from "./merge-request-component/merge-request-view.component";
import {
  BusinessProcessAnalyticsTrackerService,
  FinalProductPublishingComponent,
} from "@mxflow/features/business-process";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockComponent } from "ng-mocks";
import { BuildAndTestBranchDetailsComponent } from "../../../common/branch-details/build-and-test-branch-details.component";
import { SendForReviewComponent } from "../../../common/send-for-review/send-for-review.component";
import { MergeRequest } from "@mxflow/features/scm-management";
import { NO_ERRORS_SCHEMA } from "@angular/core";

describe("Integrate Changes Component Test", () => {
  const processId = "processId";
  const mergeJobId = "mergeJobId";
  const projectId = "projectId";

  let fixture: ComponentFixture<IntegrateChangesComponent>;
  let processExecutionUpdater: Partial<CiProcessExecutionStateUpdaterService>;
  let trackerService: Partial<BusinessProcessAnalyticsTrackerService>;
  let mergeRequestComponent: MergeRequestViewComponent;

  let component: IntegrateChangesComponent;

  beforeEach(() => {
    processExecutionUpdater = {
      reloadProcessDetails: jest.fn(),
    };

    trackerService = {
      trackCiProcessFixIssues: jest.fn(),
    };

    mergeRequestComponent = {
      initializeMergeRequest: jest.fn(),
    } as unknown as MergeRequestViewComponent;

    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: CiProcessExecutionStateUpdaterService,
          useValue: processExecutionUpdater,
        },
        {
          provide: BusinessProcessAnalyticsTrackerService,
          useValue: trackerService,
        },
      ],
      declarations: [
        MergeRequestViewComponent,
        MockComponent(BuildAndTestBranchDetailsComponent),
        MockComponent(MergeRequestViewComponent),
      ],
      imports: [
        MockComponent(FinalProductPublishingComponent),
        MockComponent(SendForReviewComponent),
      ],
    });

    fixture = TestBed.createComponent(IntegrateChangesComponent);
    component = fixture.componentInstance;
    component.mergeRequestViewComponent = mergeRequestComponent;
    component.projectId = projectId;
    component.ciProcessExecutionId = processId;
  });

  it("should show create new merge request button if the merge request is not reopenable", () => {
    component.mergeRequestDetails = {
      id: "mr-id",
      isReOpenable: false,
      mergeConfiguration: { id: "id" },
      title: "title",
    } as MergeRequest;
    fixture.detectChanges();

    const reopenElement = fixture.nativeElement.querySelector(
      "mxevolve-ci-process-merge-request-reopen"
    );
    const createMergeRequestElement = fixture.nativeElement.querySelector(
      `#create-new-merge-request-submit-btn`
    );

    expect(reopenElement).toBeFalsy();
    expect(createMergeRequestElement).toBeTruthy();
  });

  it("should show only reopen merge request button if the merge request is reopenable", () => {
    component.mergeRequestDetails = {
      id: "mr-id",
      isReOpenable: true,
      mergeConfiguration: { id: "id" },
      title: "title",
    } as MergeRequest;
    fixture.detectChanges();

    const reopenElement = fixture.nativeElement.querySelector(
      "mxevolve-ci-process-merge-request-reopen"
    );
    const createMergeRequestElement = fixture.nativeElement.querySelector(
      `#create-new-merge-request-submit-btn`
    );

    expect(reopenElement).toBeTruthy();
    expect(createMergeRequestElement).toBeFalsy();
  });

  it("should raise an event when the fix issues button is clicked", () => {
    const emitEvent = jest.spyOn(component.fixIssuesEvent, "emit");
    component.fixIssues();
    expect(emitEvent).toHaveBeenCalled();
  });

  it("should track the fix issue button", () => {
    component.fixIssues();

    expect(trackerService.trackCiProcessFixIssues).toHaveBeenCalled();
  });

  it("should update the state in the store when the merge request is created", () => {
    component.mergeRequestCreated();

    expect(processExecutionUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      processId,
      projectId
    );
    setTimeout(() => {
      expect(mergeRequestComponent.initializeMergeRequest).toHaveBeenCalledWith(
        mergeJobId
      );
    }, 1500);
  });

  describe("when the merge request is reopened", () => {
    it("given a reopenable merge request when the reopen event is emitted then the process state is refreshed", () => {
      component.mergeRequestReopened();

      expect(processExecutionUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        processId,
        projectId
      );
    });
  });

  describe("Show Publishing", () => {
    it("should not show publish final product if final product publishing is null", () => {
      component.willPublishFinalProduct = true;

      expect(component.shouldShowPublishing()).toStrictEqual(false);
    });

    it("should not show publish final product if it will not publish", () => {
      component.finalProductPublishing = {
        id: "id",
        publishingStartDate: "",
        publishingEndDate: "",
      };
      component.willPublishFinalProduct = false;

      expect(component.shouldShowPublishing()).toStrictEqual(false);
    });

    it("should show publish final product if all conditions are met", () => {
      component.finalProductPublishing = {
        id: "id",
        publishingStartDate: "",
        publishingEndDate: "",
      };
      component.willPublishFinalProduct = true;

      expect(component.shouldShowPublishing()).toStrictEqual(true);
    });
  });
});
