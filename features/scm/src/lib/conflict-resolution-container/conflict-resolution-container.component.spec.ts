import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EMPTY, of, Subject, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";

import { ConflictResolutionContainerComponent } from "./conflict-resolution-container.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { GitFileStatusCode } from "../remote-cloned-repository/model/git-file-status-code.enum";
import {
  ConflictResolutionDecision,
  ConflictResolutionDecisionType,
} from "../conflict-resolution-buttons/model/conflict-resolution-decision.model";

@Component({
  selector: "mxevolve-conflict-resolution-buttons",
  standalone: true,
  template: "",
})
class MockConflictResolutionButtonsComponent {
  @Input({ required: true })
  filePath!: string;

  @Input({ required: true })
  gitFileStatusCode!: GitFileStatusCode;

  @Output()
  decisionTaken = new EventEmitter<ConflictResolutionDecision>();
}

@Component({
  selector: "mxevolve-text-conflict-editor",
  standalone: true,
  template: "",
})
class MockTextConflictEditorComponent {
  @Input({ required: true })
  initialContent!: string;

  @Input()
  language = "plaintext";

  @Input()
  isResolving = false;

  @Output()
  resolvedContent = new EventEmitter<string>();
}

describe("ConflictResolutionContainerComponent", () => {
  const PROJECT_ID = "project-1";
  const REPOSITORY_ID = "repository-1";
  const FILE_PATH = "path/to/file.txt";
  const DECISION_FILE_PATH = "path/to/another-file.txt";
  const RAW_CONFLICT_CONTENT = "<<<<<<< HEAD\nlocal\n=======\nremote\n>>>>>>>";

  const KEEP_LOCAL_DECISION: ConflictResolutionDecision = {
    decision: ConflictResolutionDecisionType.KEEP_LOCAL,
    filePath: FILE_PATH,
  };
  const KEEP_REMOTE_DECISION: ConflictResolutionDecision = {
    decision: ConflictResolutionDecisionType.KEEP_REMOTE,
    filePath: FILE_PATH,
  };
  const DELETE_FILE_DECISION: ConflictResolutionDecision = {
    decision: ConflictResolutionDecisionType.DELETE_FILE,
    filePath: FILE_PATH,
  };
  const RESOLVED_BY_DECISION = {
    [ConflictResolutionDecisionType.KEEP_LOCAL]: "resolved-local-content",
    [ConflictResolutionDecisionType.KEEP_REMOTE]: "resolved-remote-content",
  };

  type MockRemoteClonedRepositoryService = Pick<
    RemoteClonedRepositoryService,
    "deleteRemoteFile" | "writeRemoteFileContent" | "stageFileChanges"
  >;
  type MockToastMessageService = Pick<
    ToastMessageService,
    "showSuccess" | "showError"
  >;

  let fixture: ComponentFixture<ConflictResolutionContainerComponent>;
  let component: ConflictResolutionContainerComponent;
  let remoteClonedRepositoryServiceMock: jest.Mocked<MockRemoteClonedRepositoryService>;
  let toastMessageServiceMock: jest.Mocked<MockToastMessageService>;

  beforeEach(async () => {
    remoteClonedRepositoryServiceMock = {
      deleteRemoteFile: jest.fn().mockReturnValue(EMPTY),
      writeRemoteFileContent: jest.fn().mockReturnValue(EMPTY),
      stageFileChanges: jest.fn().mockReturnValue(EMPTY),
    };
    toastMessageServiceMock = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConflictResolutionContainerComponent],
      providers: [
        {
          provide: ToastMessageService,
          useValue: toastMessageServiceMock,
        },
      ],
    })
      .overrideComponent(ConflictResolutionContainerComponent, {
        set: {
          imports: [
            MockConflictResolutionButtonsComponent,
            MockTextConflictEditorComponent,
          ],
          providers: [
            {
              provide: RemoteClonedRepositoryService,
              useValue: remoteClonedRepositoryServiceMock,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConflictResolutionContainerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteClonedRepositoryId", REPOSITORY_ID);
    fixture.componentRef.setInput("filePath", FILE_PATH);
    fixture.componentRef.setInput("rawConflictContent", RAW_CONFLICT_CONTENT);
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.BOTH_ADDED
    );
    fixture.componentRef.setInput(
      "resolvedContentByDecision",
      RESOLVED_BY_DECISION
    );
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("should create component when initialized", () => {
    expect(component).toBeTruthy();
  });

  describe("shouldRenderTextConflictEditor", () => {
    it("should be true when git status is both modified", () => {
      fixture.componentRef.setInput(
        "gitFileStatusCode",
        GitFileStatusCode.BOTH_MODIFIED
      );
      expect(component.shouldRenderTextConflictEditor()).toBe(true);
    });

    it("should be true when git status is both added", () => {
      fixture.componentRef.setInput(
        "gitFileStatusCode",
        GitFileStatusCode.BOTH_ADDED
      );
      expect(component.shouldRenderTextConflictEditor()).toBe(true);
    });

    it("should be true when git status is index modified", () => {
      fixture.componentRef.setInput(
        "gitFileStatusCode",
        GitFileStatusCode.INDEX_MODIFIED
      );
      expect(component.shouldRenderTextConflictEditor()).toBe(true);
    });

    it("should be false for non-editable statuses", () => {
      const nonEditableStatuses: GitFileStatusCode[] = [
        GitFileStatusCode.DELETED_LOCALLY,
        GitFileStatusCode.DELETED_REMOTELY,
        GitFileStatusCode.ADDED_LOCALLY,
        GitFileStatusCode.ADDED_REMOTELY,
        GitFileStatusCode.BOTH_DELETED,
      ];

      for (const status of nonEditableStatuses) {
        fixture.componentRef.setInput("gitFileStatusCode", status);
        expect(component.shouldRenderTextConflictEditor()).toBe(false);
      }
    });
  });

  describe("onDecisionSelected — DELETE_FILE", () => {
    it("should delete and then stage file changes", () => {
      remoteClonedRepositoryServiceMock.deleteRemoteFile.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        of(undefined)
      );

      component.onDecisionSelected(DELETE_FILE_DECISION);

      expect(
        remoteClonedRepositoryServiceMock.deleteRemoteFile
      ).toHaveBeenCalledTimes(1);
      expect(
        remoteClonedRepositoryServiceMock.deleteRemoteFile
      ).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: FILE_PATH,
        checkRepositoryAvailability: false,
      });
      expect(
        remoteClonedRepositoryServiceMock.stageFileChanges
      ).toHaveBeenCalledTimes(1);
      expect(
        remoteClonedRepositoryServiceMock.stageFileChanges
      ).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePaths: [FILE_PATH],
        stageAll: false,
      });
      expect(
        remoteClonedRepositoryServiceMock.writeRemoteFileContent
      ).not.toHaveBeenCalled();
    });

    it("should emit decisionTaken and show success toast on successful delete and stage", () => {
      const decisionTakenSpy = jest.spyOn(component.decisionTaken, "emit");
      remoteClonedRepositoryServiceMock.deleteRemoteFile.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        of(undefined)
      );

      component.onDecisionSelected(DELETE_FILE_DECISION);

      expect(decisionTakenSpy).toHaveBeenCalledWith(DELETE_FILE_DECISION);
      expect(toastMessageServiceMock.showSuccess).toHaveBeenCalledWith(
        "File deleted successfully"
      );
    });

    it("should show error toast and swallow the error (no emit) when delete fails", () => {
      const decisionTakenSpy = jest.spyOn(component.decisionTaken, "emit");
      remoteClonedRepositoryServiceMock.deleteRemoteFile.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      component.onDecisionSelected(DELETE_FILE_DECISION);

      expect(decisionTakenSpy).not.toHaveBeenCalled();
      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        "Failed to delete file",
        "boom"
      );
      expect(
        remoteClonedRepositoryServiceMock.stageFileChanges
      ).not.toHaveBeenCalled();
    });

    it("should show error toast and swallow the error (no emit) when stage fails after delete", () => {
      const decisionTakenSpy = jest.spyOn(component.decisionTaken, "emit");
      remoteClonedRepositoryServiceMock.deleteRemoteFile.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        throwError(() => new Error("stage failed"))
      );

      component.onDecisionSelected(DELETE_FILE_DECISION);

      expect(decisionTakenSpy).not.toHaveBeenCalled();
      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        "Failed to delete file",
        "stage failed"
      );
    });
  });

  describe("onDecisionSelected — write decisions", () => {
    it("should write and then stage file changes for KEEP_LOCAL", () => {
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        of(undefined)
      );

      component.onDecisionSelected(KEEP_LOCAL_DECISION);

      expect(
        remoteClonedRepositoryServiceMock.writeRemoteFileContent
      ).toHaveBeenCalledTimes(1);
      expect(
        remoteClonedRepositoryServiceMock.writeRemoteFileContent
      ).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: FILE_PATH,
        fileContent:
          RESOLVED_BY_DECISION[ConflictResolutionDecisionType.KEEP_LOCAL],
        checkRepositoryAvailability: false,
      });
      expect(
        remoteClonedRepositoryServiceMock.stageFileChanges
      ).toHaveBeenCalledTimes(1);
      expect(
        remoteClonedRepositoryServiceMock.stageFileChanges
      ).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePaths: [FILE_PATH],
        stageAll: false,
      });
      expect(
        remoteClonedRepositoryServiceMock.deleteRemoteFile
      ).not.toHaveBeenCalled();
    });

    it("should emit decisionTaken and show success toast on successful write", () => {
      const decisionTakenSpy = jest.spyOn(component.decisionTaken, "emit");
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        of(undefined)
      );

      component.onDecisionSelected(KEEP_REMOTE_DECISION);

      expect(decisionTakenSpy).toHaveBeenCalledWith(KEEP_REMOTE_DECISION);
      expect(toastMessageServiceMock.showSuccess).toHaveBeenCalledWith(
        "File resolved successfully"
      );
    });

    it("should do nothing when decision type has no resolved content", () => {
      const decisionTakenSpy = jest.spyOn(component.decisionTaken, "emit");
      const givenDecisionWithoutContent: ConflictResolutionDecision = {
        decision: ConflictResolutionDecisionType.KEEP_BASE,
        filePath: FILE_PATH,
      };

      component.onDecisionSelected(givenDecisionWithoutContent);

      expect(
        remoteClonedRepositoryServiceMock.writeRemoteFileContent
      ).not.toHaveBeenCalled();
      expect(
        remoteClonedRepositoryServiceMock.deleteRemoteFile
      ).not.toHaveBeenCalled();
      expect(decisionTakenSpy).not.toHaveBeenCalled();
    });

    it("should use decision's filePath (not component's) when writing", () => {
      const givenDecision: ConflictResolutionDecision = {
        decision: ConflictResolutionDecisionType.KEEP_LOCAL,
        filePath: DECISION_FILE_PATH,
      };
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        of(undefined)
      );

      component.onDecisionSelected(givenDecision);

      expect(
        remoteClonedRepositoryServiceMock.writeRemoteFileContent
      ).toHaveBeenCalledWith(
        expect.objectContaining({ filePath: DECISION_FILE_PATH })
      );
    });

    it("should show error toast and swallow the error (no emit) when write fails", () => {
      const decisionTakenSpy = jest.spyOn(component.decisionTaken, "emit");
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        throwError(() => new Error("write failed"))
      );

      component.onDecisionSelected(KEEP_LOCAL_DECISION);

      expect(decisionTakenSpy).not.toHaveBeenCalled();
      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        "Failed to resolve file",
        "write failed"
      );
      expect(
        remoteClonedRepositoryServiceMock.stageFileChanges
      ).not.toHaveBeenCalled();
    });

    it("should show error toast and swallow the error (no emit) when stage fails", () => {
      const decisionTakenSpy = jest.spyOn(component.decisionTaken, "emit");
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        throwError(() => new Error("stage failed"))
      );

      component.onDecisionSelected(KEEP_LOCAL_DECISION);

      expect(decisionTakenSpy).not.toHaveBeenCalled();
      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        "Failed to resolve file",
        "stage failed"
      );
    });
  });

  describe("onEditorContentResolved", () => {
    const givenResolvedContent = "resolved-editor-content";

    it("should keep resolve loading active until save and stage complete", () => {
      const givenSaveCompleted = of(undefined);
      const givenStageSubject = new Subject<void>();
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        givenSaveCompleted
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        givenStageSubject
      );

      component.onEditorContentResolved(givenResolvedContent);

      expect(component.isResolvingEditorContent()).toBe(true);

      givenStageSubject.next();
      givenStageSubject.complete();

      expect(component.isResolvingEditorContent()).toBe(false);
    });

    it("should write and then stage file changes with component's filePath", () => {
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        of(undefined)
      );

      component.onEditorContentResolved(givenResolvedContent);

      expect(
        remoteClonedRepositoryServiceMock.writeRemoteFileContent
      ).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: FILE_PATH,
        fileContent: givenResolvedContent,
        checkRepositoryAvailability: false,
      });
      expect(
        remoteClonedRepositoryServiceMock.stageFileChanges
      ).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePaths: [FILE_PATH],
        stageAll: false,
      });
    });

    it("should emit resolvedContent and show editor-change success toast on success", () => {
      const resolvedContentSpy = jest.spyOn(component.resolvedContent, "emit");
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        of(undefined)
      );

      component.onEditorContentResolved(givenResolvedContent);

      expect(resolvedContentSpy).toHaveBeenCalledWith(givenResolvedContent);
      expect(toastMessageServiceMock.showSuccess).toHaveBeenCalledWith(
        "Changes saved successfully"
      );
    });

    it("should show error toast and swallow the error (no emit) when save fails", () => {
      const resolvedContentSpy = jest.spyOn(component.resolvedContent, "emit");
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        throwError(() => new Error("save failed"))
      );

      component.onEditorContentResolved(givenResolvedContent);

      expect(resolvedContentSpy).not.toHaveBeenCalled();
      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        "Failed to save changes",
        "save failed"
      );
      expect(
        remoteClonedRepositoryServiceMock.stageFileChanges
      ).not.toHaveBeenCalled();
    });

    it("should show error toast and swallow the error (no emit) when stage fails", () => {
      const resolvedContentSpy = jest.spyOn(component.resolvedContent, "emit");
      remoteClonedRepositoryServiceMock.writeRemoteFileContent.mockReturnValue(
        of(undefined)
      );
      remoteClonedRepositoryServiceMock.stageFileChanges.mockReturnValue(
        throwError(() => new Error("stage failed"))
      );

      component.onEditorContentResolved(givenResolvedContent);

      expect(resolvedContentSpy).not.toHaveBeenCalled();
      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        "Failed to save changes",
        "stage failed"
      );
    });
  });
});
