import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { of, Subject, throwError } from "rxjs";
import { BuildAndTestMergeRequestReopenComponent } from "./build-and-test-merge-request-reopen.component";
import { CiProcessExecutionService } from "../../service/ci-process-execution.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  MergeConfigurationService,
  GetDestinationBranchNamePipe,
  MergeRequestReviewer,
} from "@mxflow/features/scm-management";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

const PROJECT_ID = "project-id";
const PROCESS_ID = "process-id";
const MERGE_CONFIGURATION_ID = "merge-config-id";
const DESTINATION_BRANCH_NAME = "main";
const MERGE_REQUEST_TITLE = "Merge Request Title";
const MERGE_REQUEST_REVIEWERS: MergeRequestReviewer[] = [
  { name: "alice", displayName: "Alice" },
  { name: "bob", displayName: "Bob" },
];
const UPDATED_MERGE_REQUEST_TITLE = "Updated Merge Request Title";
const UPDATED_MERGE_REQUEST_REVIEWERS = ["charlie", "diana"];
const ERROR_MESSAGE = "Service error";

describe("BuildAndTestMergeRequestReopenComponent", () => {
  let component: BuildAndTestMergeRequestReopenComponent;
  let fixture: ComponentFixture<BuildAndTestMergeRequestReopenComponent>;
  let ciProcessService: jest.Mocked<Partial<CiProcessExecutionService>>;
  let toastMessageService: jest.Mocked<Partial<ToastMessageService>>;

  beforeEach(async () => {
    ciProcessService = { reopenMergeRequest: jest.fn(() => of(undefined)) };
    toastMessageService = { showError: jest.fn() };

    await TestBed.configureTestingModule({ schemas: [NO_ERRORS_SCHEMA] })
      .overrideComponent(BuildAndTestMergeRequestReopenComponent, {
        set: {
          imports: [
            ReactiveFormsModule,
            CommonModule,
            GetDestinationBranchNamePipe,
          ],
          providers: [
            { provide: CiProcessExecutionService, useValue: ciProcessService },
            { provide: ToastMessageService, useValue: toastMessageService },
            {
              provide: MergeConfigurationService,
              useValue: {
                getFilteredMergeConfigurations: jest.fn(() =>
                  of({ content: [{ branchName: DESTINATION_BRANCH_NAME }] })
                ),
              },
            },
            {
              provide: ProjectIdRouteParamsResolverService,
              useValue: { resolve: jest.fn(() => PROJECT_ID) },
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BuildAndTestMergeRequestReopenComponent);
    component = fixture.componentInstance;
    component.projectId = PROJECT_ID;
    component.processId = PROCESS_ID;
    component.mergeConfigurationId = MERGE_CONFIGURATION_ID;
    component.mergeRequestTitle = MERGE_REQUEST_TITLE;
    component.mergeRequestReviewers = MERGE_REQUEST_REVIEWERS;
    fixture.detectChanges();
  });

  describe("clicking on reopen button", () => {
    it("given the merge request details are not editable when the user clicks reopen then the reopen is executed directly without changing the title and reviewers", () => {
      component.areMergeRequestDetailsEditable = false;

      component.onReopenButtonClick();

      expect(ciProcessService.reopenMergeRequest).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        ciProcessExecutionId: PROCESS_ID,
        title: undefined,
        reviewers: undefined,
      });
    });

    it("given the merge request details are editable when the user clicks reopen then the details dialog is shown", () => {
      component.areMergeRequestDetailsEditable = true;

      component.onReopenButtonClick();

      expect(component.isModalVisible).toBe(true);
    });

    it("given the service fails when the user triggers reopen directly then a toast error is displayed", () => {
      component.areMergeRequestDetailsEditable = false;
      ciProcessService.reopenMergeRequest = jest.fn(() =>
        throwError(() => new Error(ERROR_MESSAGE))
      );

      component.onReopenButtonClick();

      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR_MESSAGE);
    });

    it("given the user clicks reopen when the request is in flight then the loading indicator is shown", () => {
      component.areMergeRequestDetailsEditable = false;
      const pending$ = new Subject<void>();
      ciProcessService.reopenMergeRequest = jest.fn(() => pending$);

      component.onReopenButtonClick();

      expect(component.loading).toBe(true);
    });

    it("given the service succeeds when the user triggers reopen directly then the loading indicator is hidden", () => {
      component.areMergeRequestDetailsEditable = false;

      component.onReopenButtonClick();

      expect(component.loading).toBe(false);
    });

    it("given the service fails when the user triggers reopen directly then the loading indicator is hidden", () => {
      component.areMergeRequestDetailsEditable = false;
      ciProcessService.reopenMergeRequest = jest.fn(() =>
        throwError(() => new Error(ERROR_MESSAGE))
      );

      component.onReopenButtonClick();

      expect(component.loading).toBe(false);
    });
  });

  describe("reopening merge request and editing the title and reviewers", () => {
    beforeEach(() => {
      component.areMergeRequestDetailsEditable = true;
      component.onReopenButtonClick();
      fixture.detectChanges();
    });

    it("given prefilled title when the dialog is opened then the title field shows the prefilled value and is editable", () => {
      expect(component.form.get("mergeRequestTitle")?.value).toBe(
        MERGE_REQUEST_TITLE
      );
      expect(component.form.get("mergeRequestTitle")?.enabled).toBe(true);
    });

    it("given a merge configuration id when the dialog is opened then the destination branch field shows the resolved branch name and cannot be edited", () => {
      const destinationInput = fixture.nativeElement.querySelector(
        "#destinationBranch"
      ) as HTMLInputElement;
      expect(destinationInput.value).toBe(DESTINATION_BRANCH_NAME);
      expect(destinationInput.disabled).toBe(true);
    });

    it("given prefilled reviewers when the dialog is opened then the reviewers field shows the prefilled values and is editable", () => {
      const reviewerNames = (
        component.reviewerFormControl.value as { name: string }[]
      ).map((reviewer) => reviewer.name);
      expect(reviewerNames).toEqual(MERGE_REQUEST_REVIEWERS.map((r) => r.name));
      expect(component.reviewerFormControl.enabled).toBe(true);
    });

    it("given an empty title when the user tries to reopen then the submit button is disabled", () => {
      component.form.get("mergeRequestTitle")?.setValue("");
      fixture.detectChanges();
      expect(component.form.valid).toBe(false);
    });

    it("given a non empty title when the user tries to reopen then the submit button is enabled", () => {
      component.form.get("mergeRequestTitle")?.setValue(MERGE_REQUEST_TITLE);
      fixture.detectChanges();
      expect(component.form.valid).toBe(true);
    });

    it("given the user updates title and reviewers when submitting then the service is called with the new values", () => {
      component.form
        .get("mergeRequestTitle")
        ?.setValue(UPDATED_MERGE_REQUEST_TITLE);
      component.reviewerFormControl.setValue(
        UPDATED_MERGE_REQUEST_REVIEWERS.map((name) => ({
          name,
          displayName: name,
        }))
      );

      component.onDialogReopen();

      expect(ciProcessService.reopenMergeRequest).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        ciProcessExecutionId: PROCESS_ID,
        title: UPDATED_MERGE_REQUEST_TITLE,
        reviewers: UPDATED_MERGE_REQUEST_REVIEWERS,
      });
    });

    it("given the service succeeds when the user submits then the dialog is closed and the parent is notified", () => {
      const reopenedSpy = jest.fn();
      component.reopened.subscribe(reopenedSpy);

      component.onDialogReopen();

      expect(component.isModalVisible).toBe(false);
      expect(reopenedSpy).toHaveBeenCalledTimes(1);
    });

    it("given a reopen is already in progress when the user tries to submit again then no additional service call is made", () => {
      component.dialogLoading = true;

      component.onDialogReopen();

      expect(ciProcessService.reopenMergeRequest).not.toHaveBeenCalled();
    });

    it("given the service fails when the user submits then the dialog remains open", () => {
      ciProcessService.reopenMergeRequest = jest.fn(() =>
        throwError(() => new Error(ERROR_MESSAGE))
      );

      component.onDialogReopen();

      expect(component.isModalVisible).toBe(true);
    });

    it("given the dialog is open when the user cancels then the dialog is closed", () => {
      component.onDialogCancel();

      expect(component.isModalVisible).toBe(false);
    });

    it("given the user clicks reopen when the request through the button then the loading indicator is shown in the dialog", () => {
      const pending$ = new Subject<void>();
      ciProcessService.reopenMergeRequest = jest.fn(() => pending$);
      component.areMergeRequestDetailsEditable = false;
      component.onReopenButtonClick();

      expect(component.loading).toBe(true);
    });

    it("given the reopen from the button is successful then the loading indicator is hidden", () => {
      component.areMergeRequestDetailsEditable = false;
      component.onReopenButtonClick();

      expect(component.loading).toBe(false);
    });

    it("given the reopen from the button fails then the loading indicator is hidden", () => {
      component.areMergeRequestDetailsEditable = false;
      ciProcessService.reopenMergeRequest = jest.fn(() =>
        throwError(() => new Error(ERROR_MESSAGE))
      );

      component.onReopenButtonClick();

      expect(component.loading).toBe(false);
    });

    it("given the user clicks reopen when the request through the dialog then the loading indicator is shown in the dialog", () => {
      const pending$ = new Subject<void>();
      ciProcessService.reopenMergeRequest = jest.fn(() => pending$);

      component.onDialogReopen();

      expect(component.dialogLoading).toBe(true);
    });

    it("given the reopen from the dialog is successful then the loading indicator is hidden", () => {
      component.onDialogReopen();

      expect(component.dialogLoading).toBe(false);
    });

    it("given the reopen from the dialog fails then the loading indicator is hidden", () => {
      ciProcessService.reopenMergeRequest = jest.fn(() =>
        throwError(() => new Error(ERROR_MESSAGE))
      );

      component.onDialogReopen();

      expect(component.dialogLoading).toBe(false);
    });
  });
});
