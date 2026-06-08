import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { of, throwError } from "rxjs";
import { FileEditorViewComponent } from "./file-editor-view.component";
import { RemoteClonedRepositoryService } from "@mxflow/features/scm";
import { ToastMessageService } from "@mxflow/ui/alert";
import { MonacoEditorService } from "@mxflow/ui/monaco-editor";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { RemoteClonedRepositoryState } from "../remote-cloned-repository/response/get-remote-cloned-repository-state-api-response";
import { SkeletonModule } from "primeng/skeleton";
import { By } from "@angular/platform-browser";

jest.mock(
  "monaco-editor/esm/vs/editor/editor.api.js",
  () => ({ Range: jest.fn() }),
  { virtual: true }
);

const FILE_PATH = "src/app/config.ts";
const PROJECT_ID = "project-1";
const REPOSITORY_ID = "repo-1";
const FILE_CONTENT = "file content";
const NEW_FILE_CONTENT = "new file content";

const mockEditor = {
  getValue: jest.fn().mockReturnValue(FILE_CONTENT),
  setValue: jest.fn(),
  updateOptions: jest.fn(),
  focus: jest.fn(),
  onDidChangeModelContent: jest.fn().mockReturnValue({ dispose: jest.fn() }),
};

const remoteServiceMock = {
  readRemoteFileContent: jest.fn(),
  writeRemoteFileContent: jest.fn(),
  resetChanges: jest.fn(),
  getRemoteClonedRepositoryState: jest.fn(),
};

const toastServiceMock = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

@Component({
  selector: "mxevolve-monaco-editor",
  standalone: true,
  template: "",
})
class MockMonacoEditorComponent {
  @Input() initialContent = "";
  @Input() language = "plaintext";
  @Input() options = {};
  @Output() editorReady = new EventEmitter<unknown>();

  getValue(): string {
    return mockEditor.getValue();
  }
}

@Component({
  standalone: true,
  imports: [FileEditorViewComponent],
  template: `<mxevolve-file-editor-view
    [projectId]="projectId"
    [repositoryId]="repositoryId"
    [filePath]="filePath"
    (fileSaved)="onFileSaved()"
    (fileRestored)="onFileRestored()"
  />`,
})
class TestHostComponent {
  projectId = PROJECT_ID;
  repositoryId = REPOSITORY_ID;
  filePath = FILE_PATH;
  fileSaved = false;
  fileRestored = false;

  onFileSaved(): void {
    this.fileSaved = true;
  }

  onFileRestored(): void {
    this.fileRestored = true;
  }
}

describe("FileEditorViewComponent", () => {
  type ReadyEditor = Parameters<FileEditorViewComponent["onEditorReady"]>[0];

  let fixture: ComponentFixture<TestHostComponent>;
  let component: FileEditorViewComponent;
  let isFixtureDestroyed: boolean;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, FileEditorViewComponent],
    }).overrideComponent(FileEditorViewComponent, {
      set: {
        imports: [MockMonacoEditorComponent, Button, Tooltip, SkeletonModule],
        providers: [
          {
            provide: RemoteClonedRepositoryService,
            useValue: remoteServiceMock,
          },
          { provide: ToastMessageService, useValue: toastServiceMock },
          { provide: MonacoEditorService, useValue: {} },
        ],
      },
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;

    jest.clearAllMocks();
    isFixtureDestroyed = false;

    remoteServiceMock.readRemoteFileContent.mockReturnValue(
      of({ payload: FILE_CONTENT })
    );
    remoteServiceMock.writeRemoteFileContent.mockReturnValue(of(undefined));
    remoteServiceMock.resetChanges.mockReturnValue(of(undefined));
    remoteServiceMock.getRemoteClonedRepositoryState.mockReturnValue(
      of({ remoteClonedRepositoryState: RemoteClonedRepositoryState.AVAILABLE })
    );

    fixture.detectChanges();
    TestBed.tick();

    component.onEditorReady(mockEditor as unknown as ReadyEditor);
  });

  afterEach(() => {
    if (!isFixtureDestroyed) {
      fixture.destroy();
    }
  });

  describe("initialization", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
    });

    it("should load file content on init", () => {
      expect(remoteServiceMock.readRemoteFileContent).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: FILE_PATH,
      });
    });

    it("should set file content signal after successful load", () => {
      expect(component.fileContent()).toBe(FILE_CONTENT);
    });

    it("should set isLoading to false after load completes", () => {
      expect(component.isLoading()).toBe(false);
    });

    it("should start in read only mode", () => {
      expect(component.isEditing()).toBe(false);
    });

    it("should show loading state when file content has not loaded", () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const whenSkeletons =
        fixture.nativeElement.querySelectorAll("p-skeleton");
      const whenEditor = fixture.debugElement.query(
        By.directive(MockMonacoEditorComponent)
      );

      expect(whenSkeletons.length).toBeGreaterThan(0);
      expect(whenEditor).toBeNull();
    });
  });

  describe("language computation", () => {
    it("should compute typescript for .ts files", () => {
      expect(component.language()).toBe("typescript");
    });

    it("should fall back to plaintext for unknown extensions", () => {
      fixture.componentInstance.filePath = "file.unknown";
      fixture.detectChanges();
      TestBed.tick();

      expect(component.language()).toBe("plaintext");
    });
  });

  describe("repository state", () => {
    it("should fetch repository state on init", () => {
      expect(
        remoteServiceMock.getRemoteClonedRepositoryState
      ).toHaveBeenCalledWith(PROJECT_ID, REPOSITORY_ID);
    });

    it("should set isRepositoryAvailable to true when state is AVAILABLE", () => {
      expect(component.isRepositoryAvailable()).toBe(true);
    });

    it.each([
      RemoteClonedRepositoryState.PREPARING,
      RemoteClonedRepositoryState.IN_USE,
      RemoteClonedRepositoryState.PREPARATION_FAILED,
    ])(
      "should set isRepositoryAvailable to false when state is %s",
      (state) => {
        remoteServiceMock.getRemoteClonedRepositoryState.mockReturnValue(
          of({ remoteClonedRepositoryState: state })
        );

        fixture.componentInstance.repositoryId = "repo-2";
        fixture.detectChanges();
        TestBed.tick();

        expect(component.isRepositoryAvailable()).toBe(false);
      }
    );

    it("should set isRepositoryAvailable to false when state fetch fails", () => {
      remoteServiceMock.getRemoteClonedRepositoryState.mockReturnValue(
        throwError(() => new Error("State fetch failed"))
      );

      fixture.componentInstance.repositoryId = "repo-2";
      fixture.detectChanges();
      TestBed.tick();

      expect(component.isRepositoryAvailable()).toBe(false);
    });

    it("should show error toast when state fetch fails", () => {
      remoteServiceMock.getRemoteClonedRepositoryState.mockReturnValue(
        throwError(() => new Error("State fetch failed"))
      );

      fixture.componentInstance.repositoryId = "repo-2";
      fixture.detectChanges();
      TestBed.tick();

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        "Failed to fetch repository state: State fetch failed",
        "State Error"
      );
    });

    it("should re-fetch state when repositoryId changes", () => {
      fixture.componentInstance.repositoryId = "repo-2";
      fixture.detectChanges();
      TestBed.tick();

      expect(
        remoteServiceMock.getRemoteClonedRepositoryState
      ).toHaveBeenCalledWith(PROJECT_ID, "repo-2");
    });
  });

  describe("onEdit", () => {
    it("should set isEditing to true", () => {
      component.onEdit();

      expect(component.isEditing()).toBe(true);
    });

    it("should make editor writable", () => {
      component.onEdit();

      expect(mockEditor.updateOptions).toHaveBeenCalledWith({
        readOnly: false,
      });
    });

    it("should focus the editor", () => {
      component.onEdit();

      expect(mockEditor.focus).toHaveBeenCalled();
    });
  });

  describe("onSave", () => {
    beforeEach(() => {
      component.onEdit();
    });

    it("should call writeRemoteFileContent with correct params", () => {
      component.onSave();
      TestBed.tick();

      expect(remoteServiceMock.writeRemoteFileContent).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: FILE_PATH,
        fileContent: FILE_CONTENT,
        checkRepositoryAvailability: true,
      });
    });

    it("should set isEditing to false after successful save", () => {
      component.onSave();
      TestBed.tick();

      expect(component.isEditing()).toBe(false);
    });

    it("should set editor back to read only after successful save", () => {
      component.onSave();
      TestBed.tick();

      expect(mockEditor.updateOptions).toHaveBeenCalledWith({ readOnly: true });
    });

    it("should emit fileSaved after successful save", () => {
      component.onSave();
      TestBed.tick();

      expect(fixture.componentInstance.fileSaved).toBe(true);
    });

    it("should show success toast after successful save", () => {
      component.onSave();
      TestBed.tick();

      expect(toastServiceMock.showSuccess).toHaveBeenCalledWith(
        "File saved successfully."
      );
    });

    it("should set isSaving to false after save completes", () => {
      component.onSave();
      TestBed.tick();

      expect(component.isSaving()).toBe(false);
    });

    it("should show error toast when save fails", () => {
      remoteServiceMock.writeRemoteFileContent.mockReturnValue(
        throwError(() => new Error("Save failed"))
      );

      component.onSave();
      TestBed.tick();

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        "Failed to save file: Save failed",
        "Save Failed"
      );
    });

    it("should set isSaving to false when save fails", () => {
      remoteServiceMock.writeRemoteFileContent.mockReturnValue(
        throwError(() => new Error("Save failed"))
      );

      component.onSave();
      TestBed.tick();

      expect(component.isSaving()).toBe(false);
    });
  });

  describe("isDirty", () => {
    it("should be false initially", () => {
      expect(component.isDirty()).toBe(false);
    });

    it("should be true when editor content differs from saved content", () => {
      const contentChangeCallback =
        mockEditor.onDidChangeModelContent.mock.calls[0][0];
      mockEditor.getValue.mockReturnValue(NEW_FILE_CONTENT);

      contentChangeCallback();

      expect(component.isDirty()).toBe(true);
    });

    it("should be false when editor content matches saved content", () => {
      const contentChangeCallback =
        mockEditor.onDidChangeModelContent.mock.calls[0][0];
      mockEditor.getValue.mockReturnValue(NEW_FILE_CONTENT);
      contentChangeCallback();

      mockEditor.getValue.mockReturnValue(FILE_CONTENT);
      contentChangeCallback();

      expect(component.isDirty()).toBe(false);
    });

    it("should reset to false after successful save", () => {
      const contentChangeCallback =
        mockEditor.onDidChangeModelContent.mock.calls[0][0];
      mockEditor.getValue.mockReturnValue(NEW_FILE_CONTENT);
      contentChangeCallback();

      component.onEdit();
      component.onSave();
      TestBed.tick();

      expect(component.isDirty()).toBe(false);
    });
  });

  describe("file path change", () => {
    it("should reload content when filePath changes", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        of({ payload: NEW_FILE_CONTENT })
      );

      fixture.componentInstance.filePath = "src/app/new-file.ts";
      fixture.detectChanges();
      TestBed.tick();

      expect(remoteServiceMock.readRemoteFileContent).toHaveBeenCalledWith(
        expect.objectContaining({ filePath: "src/app/new-file.ts" })
      );
    });

    it("should reset to read only when filePath changes", () => {
      component.onEdit();
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        of({ payload: NEW_FILE_CONTENT })
      );

      fixture.componentInstance.filePath = "src/app/new-file.ts";
      fixture.detectChanges();
      TestBed.tick();

      expect(component.isEditing()).toBe(false);
    });

    it("should update editor content imperatively when filePath changes", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        of({ payload: NEW_FILE_CONTENT })
      );

      fixture.componentInstance.filePath = "src/app/new-file.ts";
      fixture.detectChanges();
      TestBed.tick();

      expect(mockEditor.setValue).toHaveBeenCalledWith(NEW_FILE_CONTENT);
    });

    it("should show deleted state without API call for previously-deleted file", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        throwError(
          () => new Error("File not found at path /repository/temp.txt")
        )
      );

      fixture.componentInstance.filePath = "temp.txt";
      fixture.detectChanges();
      TestBed.tick();

      jest.clearAllMocks();
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        of({ payload: "recovered" })
      );

      fixture.componentInstance.filePath = FILE_PATH;
      fixture.detectChanges();
      TestBed.tick();

      fixture.componentInstance.filePath = "temp.txt";
      fixture.detectChanges();
      TestBed.tick();

      expect(remoteServiceMock.readRemoteFileContent).not.toHaveBeenCalledWith(
        expect.objectContaining({ filePath: "temp.txt" })
      );
      expect(component.isDeletedFile()).toBe(true);
    });
  });

  describe("load failure", () => {
    it("should show error toast when file load fails", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        throwError(() => new Error("Load failed"))
      );

      fixture.componentInstance.filePath = "src/app/other.ts";
      fixture.detectChanges();
      TestBed.tick();

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        "Failed to load file: Load failed",
        "Load Failed"
      );
    });

    it("should set isLoading to false when load fails", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        throwError(() => new Error("Load failed"))
      );

      fixture.componentInstance.filePath = "src/app/other.ts";
      fixture.detectChanges();
      TestBed.tick();

      expect(component.isLoading()).toBe(false);
    });

    it("should mark file as deleted and avoid load-failed toast when file is not found", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        throwError(
          () => new Error("File not found at path /repository/newdoc-1.txt")
        )
      );

      fixture.componentInstance.filePath = "newdoc-1.txt";
      fixture.detectChanges();
      TestBed.tick();
      fixture.detectChanges();

      expect(component.isDeletedFile()).toBe(true);
      expect(toastServiceMock.showError).not.toHaveBeenCalledWith(
        expect.stringContaining("Failed to load file:"),
        "Load Failed"
      );
      expect(fixture.nativeElement.textContent).toContain(
        "This file is deleted."
      );
    });
  });

  describe("deleted file guards", () => {
    beforeEach(() => {
      component.isDeletedFile.set(true);
    });

    it("should not allow editing when file is deleted", () => {
      component.onEdit();

      expect(component.isEditing()).toBe(false);
      expect(mockEditor.updateOptions).not.toHaveBeenCalledWith({
        readOnly: false,
      });
    });

    it("should not allow saving when file is deleted", () => {
      component.onSave();
      TestBed.tick();

      expect(remoteServiceMock.writeRemoteFileContent).not.toHaveBeenCalled();
    });
  });

  describe("template", () => {
    it("should show file path in toolbar", () => {
      const el = fixture.nativeElement as HTMLElement;

      expect(el.textContent).toContain(FILE_PATH);
    });

    it("should show Edit button when not editing", () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.textContent).toContain("Edit");
    });

    it("should show Save button when editing", () => {
      component.onEdit();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.textContent).toContain("Save");
    });
  });

  describe("onRestore", () => {
    beforeEach(() => {
      component.isDeletedFile.set(true);
    });

    it("should call resetChanges with correct params", () => {
      component.onRestore();
      TestBed.tick();

      expect(remoteServiceMock.resetChanges).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        fileAndDirectoryPathsToReset: [FILE_PATH],
      });
    });

    it("should set isDeletedFile to false after successful restore", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        of({ payload: FILE_CONTENT })
      );

      component.onRestore();
      TestBed.tick();

      expect(component.isDeletedFile()).toBe(false);
    });

    it("should reload file content after successful restore", () => {
      jest.clearAllMocks();
      remoteServiceMock.resetChanges.mockReturnValue(of(undefined));
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        of({ payload: FILE_CONTENT })
      );

      component.onRestore();
      TestBed.tick();

      expect(remoteServiceMock.readRemoteFileContent).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REPOSITORY_ID,
        filePath: FILE_PATH,
      });
    });

    it("should emit fileRestored after successful restore", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        of({ payload: FILE_CONTENT })
      );

      component.onRestore();
      TestBed.tick();

      expect(fixture.componentInstance.fileRestored).toBe(true);
    });

    it("should show success toast after successful restore", () => {
      remoteServiceMock.readRemoteFileContent.mockReturnValue(
        of({ payload: FILE_CONTENT })
      );

      component.onRestore();
      TestBed.tick();

      expect(toastServiceMock.showSuccess).toHaveBeenCalledWith(
        "File restored successfully."
      );
    });

    it("should set isRestoring to false after restore completes", () => {
      component.onRestore();
      TestBed.tick();

      expect(component.isRestoring()).toBe(false);
    });

    it("should show error toast when restore fails", () => {
      remoteServiceMock.resetChanges.mockReturnValue(
        throwError(() => new Error("Restore failed"))
      );

      component.onRestore();
      TestBed.tick();

      expect(toastServiceMock.showError).toHaveBeenCalledWith(
        "Failed to restore file: Restore failed",
        "Restore Failed"
      );
    });

    it("should set isRestoring to false when restore fails", () => {
      remoteServiceMock.resetChanges.mockReturnValue(
        throwError(() => new Error("Restore failed"))
      );

      component.onRestore();
      TestBed.tick();

      expect(component.isRestoring()).toBe(false);
    });

    it("should not call resetChanges when file is not deleted", () => {
      component.isDeletedFile.set(false);
      jest.clearAllMocks();

      component.onRestore();
      TestBed.tick();

      expect(remoteServiceMock.resetChanges).not.toHaveBeenCalled();
    });

    it("should show Restore button when file is deleted", () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.textContent).toContain("Restore");
    });
  });

  describe("cleanup", () => {
    it("should complete without errors when destroyed", () => {
      expect(() => {
        fixture.destroy();
        isFixtureDestroyed = true;
      }).not.toThrow();
    });
  });
});
