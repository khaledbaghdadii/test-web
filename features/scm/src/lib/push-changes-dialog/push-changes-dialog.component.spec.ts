import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PushChangesDialogComponent } from "./push-changes-dialog.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { of, Subject, throwError } from "rxjs";
import { Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { MessageService } from "primeng/api";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { ScmOperationError } from "../error-handling/model/scm-operation-error";
import { ScmFailureReason } from "../error-handling/model/scm-failure-reason";
import { AuthenticationService } from "@mxflow/core/auth";

const projectId = "test-project-id";
const repositoryId = "test-repository-id";
const branchName = "test-branch";
const USER_MAIL = "user-mail";
const USER_NAME = "user-name";
describe("PushChangesDialogComponent", () => {
  let messageService: jest.Mocked<ToastMessageService>;
  let remoteClonedRepositoryService: jest.Mocked<RemoteClonedRepositoryService>;
  let authService: AuthenticationService;
  let component: PushChangesDialogComponent;
  let fixture: ComponentFixture<PushChangesDialogComponent>;

  beforeEach(async () => {
    messageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
      clearErrors: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;
    authService = {
      getUserMail: jest.fn(() => USER_MAIL),
      getUsername: jest.fn(() => USER_NAME),
    } as unknown as AuthenticationService;
    remoteClonedRepositoryService = {
      commitChanges: jest.fn(() => of({})),
      getChangedFiles: jest.fn(() => of([])),
    } as unknown as jest.Mocked<RemoteClonedRepositoryService>;

    await TestBed.configureTestingModule({
      imports: [PushChangesDialogComponent],
      providers: [MessageService],
    })
      .overrideComponent(PushChangesDialogComponent, {
        set: {
          providers: [
            { provide: ToastMessageService, useValue: messageService },
            {
              provide: RemoteClonedRepositoryService,
              useValue: remoteClonedRepositoryService,
            },
            { provide: AuthenticationService, useValue: authService },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PushChangesDialogComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("projectId", projectId);
    fixture.componentRef.setInput("repositoryId", repositoryId);
    fixture.componentRef.setInput("branchName", branchName);
  });

  it("Should_CreateFormControlWithRequiredAndNotBlankValidators", () => {
    fixture.detectChanges();

    expect(component.commitMessageFormControl).toBeDefined();
    expect(component.commitMessageFormControl.value).toBeNull();
    expect(component.commitMessageFormControl.validator).toBeDefined();
    expect(
      component.commitMessageFormControl.hasValidator(Validators.required)
    ).toBeTruthy();
    expect(
      component.commitMessageFormControl.hasValidator(
        WhitespaceValidators.notBlank()
      )
    ).toBeTruthy();
    const validResult = component.commitMessageFormControl.validator?.({
      value: "a".repeat(50),
    } as Parameters<NonNullable<typeof component.commitMessageFormControl.validator>>[0]);
    const invalidResult = component.commitMessageFormControl.validator?.({
      value: "a".repeat(51),
    } as Parameters<NonNullable<typeof component.commitMessageFormControl.validator>>[0]);
    expect(validResult?.["maxlength"]).toBeUndefined();
    expect(invalidResult?.["maxlength"]).toBeDefined();
  });

  it("Should_BeInvalid_When_CommitMessageExceeds50Characters", () => {
    fixture.detectChanges();
    component.commitMessageFormControl.setValue("a".repeat(51));

    expect(
      component.commitMessageFormControl.hasError("maxlength")
    ).toBeTruthy();
  });

  it("Should_OpenDialog_When_OpenDialogIsCalled", () => {
    fixture.detectChanges();
    component.openDialog();

    expect(component.dialogVisible).toEqual(true);
  });

  it("Should_CloseAndResetForm_When_CancelDialogIsCalled", () => {
    fixture.detectChanges();
    component.openDialog();
    component.commitMessageFormControl.setValue("some message");

    component.cancelDialog();

    expect(component.dialogVisible).toEqual(false);
    expect(component.commitMessageFormControl.value).toBeNull();
  });

  it("Should_ClearErrorMessages_When_ComponentIsDestroyed", () => {
    fixture.detectChanges();

    fixture.destroy();

    expect(messageService.clearErrors).toHaveBeenCalled();
  });

  describe("submitPush", () => {
    it("Should_MarkControlAsDirty_When_FormIsInvalid", () => {
      fixture.detectChanges();
      component.submitPush();

      expect(component.commitMessageFormControl.dirty).toEqual(true);
    });

    it("Should_CallServiceToCommitAndPush_When_FormIsValid", () => {
      fixture.detectChanges();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(remoteClonedRepositoryService.commitChanges).toHaveBeenCalledWith({
        commitMessage: "VAL-1234 my changes",
        projectId: projectId,
        remoteClonedRepositoryId: repositoryId,
        branchName: branchName,
        fileAndDirectoryPathsToCommit: ["."],
        commitAuthorDetails: {
          username: USER_NAME,
          email: USER_MAIL,
        },
      });
    });

    it("Should_CommitSpecificFiles_When_FilesToCommitInputIsProvided", () => {
      fixture.componentRef.setInput("filesToCommit", ["src/app/my-file.ts"]);
      fixture.detectChanges();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(remoteClonedRepositoryService.commitChanges).toHaveBeenCalledWith({
        commitMessage: "VAL-1234 my changes",
        projectId: projectId,
        remoteClonedRepositoryId: repositoryId,
        branchName: branchName,
        fileAndDirectoryPathsToCommit: ["src/app/my-file.ts"],
        commitAuthorDetails: {
          username: USER_NAME,
          email: USER_MAIL,
        },
      });
    });

    it("Should_ShowLoaderAndDisableButton_When_PushIsInProgress", () => {
      const pushSubject = new Subject<void>();
      remoteClonedRepositoryService.commitChanges.mockReturnValue(
        pushSubject.asObservable()
      );

      fixture.detectChanges();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(component.pushInProgress).toEqual(true);

      pushSubject.next();
      pushSubject.complete();

      expect(component.pushInProgress).toEqual(false);
    });

    it("Should_CloseDialogAndResetForm_When_PushSucceeds", () => {
      const pushSubject = new Subject<void>();
      remoteClonedRepositoryService.commitChanges.mockReturnValue(
        pushSubject.asObservable()
      );

      fixture.detectChanges();
      component.openDialog();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(component.dialogVisible).toEqual(true);

      pushSubject.next();
      pushSubject.complete();

      expect(component.dialogVisible).toEqual(false);
      expect(component.commitMessageFormControl.value).toBeNull();
    });

    it("Should_ShowSuccessMessage_When_PushSucceeds", () => {
      fixture.detectChanges();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(messageService.showSuccess).toHaveBeenCalledWith(
        "Changes pushed successfully."
      );
    });

    it("Should_EmitPushSucceeded_When_PushSucceeds", () => {
      const pushSucceededSpy = jest.spyOn(component.pushSucceeded, "emit");

      fixture.detectChanges();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(pushSucceededSpy).toHaveBeenCalled();
    });

    it("Should_KeepDialogOpen_When_PushFails", () => {
      const pushSubject = new Subject<void>();
      remoteClonedRepositoryService.commitChanges.mockReturnValue(
        pushSubject.asObservable()
      );

      fixture.detectChanges();
      component.openDialog();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(component.pushInProgress).toEqual(true);
      expect(component.dialogVisible).toEqual(true);

      pushSubject.error(new Error("push error"));

      expect(component.pushInProgress).toEqual(false);
      expect(component.dialogVisible).toEqual(true);
      expect(component.commitMessageFormControl.value).toEqual(
        "VAL-1234 my changes"
      );
    });

    it("Should_ShowErrorMessage_When_PushFails", () => {
      remoteClonedRepositoryService.commitChanges.mockReturnValue(
        throwError(() => new Error("push error"))
      );

      fixture.detectChanges();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(messageService.showError).toHaveBeenCalledWith(
        "Failed to push changes."
      );
    });

    it("Should_ShowJiraIdErrorMessage_When_PushFailsDueToMissingJiraId", () => {
      remoteClonedRepositoryService.commitChanges.mockReturnValue(
        throwError(
          () =>
            new ScmOperationError(
              "hook declined - Jira issue key is required in the commit message",
              ScmFailureReason.INVALID_JIRA_ID
            )
        )
      );

      fixture.detectChanges();
      component.commitMessageFormControl.setValue("my changes without jira id");

      component.submitPush();

      expect(messageService.showError).toHaveBeenCalledWith(
        "Push rejected: A Jira ID is required in the commit message. Please include a valid Jira issue key (e.g., VAL-1234)."
      );
    });

    it("Should_ShowConflictErrorMessage_When_PushFailsDueToConflicts", () => {
      remoteClonedRepositoryService.commitChanges.mockReturnValue(
        throwError(
          () =>
            new ScmOperationError(
              "non-fast-forward update rejected",
              ScmFailureReason.COMMIT_CONFLICT
            )
        )
      );

      fixture.detectChanges();
      component.commitMessageFormControl.setValue("VAL-1234 my changes");

      component.submitPush();

      expect(messageService.showError).toHaveBeenCalledWith(
        "Push failed due to conflicts. Please resolve the conflicts and try again."
      );
    });
  });
});
