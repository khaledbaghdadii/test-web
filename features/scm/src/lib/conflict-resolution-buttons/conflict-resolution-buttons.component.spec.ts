import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GitFileStatusCode } from "../remote-cloned-repository/model/git-file-status-code.enum";
import { ConflictResolutionButtonsComponent } from "./conflict-resolution-buttons.component";
import { ConflictResolutionDecisionType } from "./model/conflict-resolution-decision.model";

describe("ConflictResolutionButtonsComponent", () => {
  const FILE_PATH = "path/to/file.txt";

  let component: ConflictResolutionButtonsComponent;
  let fixture: ComponentFixture<ConflictResolutionButtonsComponent>;

  const setStatus = (status: GitFileStatusCode): void => {
    fixture.componentRef.setInput("gitFileStatusCode", status);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConflictResolutionButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConflictResolutionButtonsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("filePath", FILE_PATH);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("initializes delete confirmation as hidden", () => {
    expect(component.deleteConfirmationVisible()).toBe(false);
  });

  it("shows keep local and delete file for ADDED_LOCALLY", () => {
    setStatus(GitFileStatusCode.ADDED_LOCALLY);

    expect(component.showKeepLocal()).toBe(true);
    expect(component.showKeepRemote()).toBe(false);
    expect(component.showDeleteFile()).toBe(true);
    expect(component.deleteFileLabel()).toBe("Delete File (Keep Remote)");
  });

  it("shows three options for DELETED_LOCALLY", () => {
    setStatus(GitFileStatusCode.DELETED_LOCALLY);

    expect(component.showDeleteFile()).toBe(true);
    expect(component.deleteFileLabel()).toBe("Delete File (Keep Local)");
    expect(component.showKeepBase()).toBe(true);
    expect(component.showKeepRemote()).toBe(true);
    expect(component.showKeepLocal()).toBe(false);
  });

  it("emits keep base decision", () => {
    setStatus(GitFileStatusCode.DELETED_LOCALLY);
    const decisionSpy = jest.spyOn(component.decisionTaken, "emit");

    component.onKeepBase();

    expect(decisionSpy).toHaveBeenCalledWith({
      decision: ConflictResolutionDecisionType.KEEP_BASE,
      filePath: FILE_PATH,
    });
  });

  it("emits keep local decision", () => {
    setStatus(GitFileStatusCode.ADDED_LOCALLY);
    const decisionSpy = jest.spyOn(component.decisionTaken, "emit");

    component.onKeepLocal();

    expect(decisionSpy).toHaveBeenCalledWith({
      decision: ConflictResolutionDecisionType.KEEP_LOCAL,
      filePath: FILE_PATH,
    });
  });

  it("emits keep remote decision", () => {
    setStatus(GitFileStatusCode.ADDED_REMOTELY);
    const decisionSpy = jest.spyOn(component.decisionTaken, "emit");

    component.onKeepRemote();

    expect(decisionSpy).toHaveBeenCalledWith({
      decision: ConflictResolutionDecisionType.KEEP_REMOTE,
      filePath: FILE_PATH,
    });
  });

  it("opens delete confirmation dialog when delete is clicked", () => {
    setStatus(GitFileStatusCode.BOTH_DELETED);

    component.onDeleteFile();

    expect(component.deleteConfirmationVisible()).toBe(true);
  });

  it("closes delete confirmation dialog when canceled", () => {
    component.deleteConfirmationVisible.set(true);

    component.onCancelDeleteFile();

    expect(component.deleteConfirmationVisible()).toBe(false);
  });

  it("emits delete decision when confirmed", () => {
    setStatus(GitFileStatusCode.BOTH_DELETED);
    component.deleteConfirmationVisible.set(true);
    const decisionSpy = jest.spyOn(component.decisionTaken, "emit");

    component.onConfirmDeleteFile();

    expect(component.deleteConfirmationVisible()).toBe(false);
    expect(decisionSpy).toHaveBeenCalledWith({
      decision: ConflictResolutionDecisionType.DELETE_FILE,
      filePath: FILE_PATH,
    });
  });

  it("maps git status to button visibility and delete label", () => {
    const cases: Array<{
      status: GitFileStatusCode;
      showDeleteFile: boolean;
      showKeepBase: boolean;
      showKeepLocal: boolean;
      showKeepRemote: boolean;
      deleteFileLabel: string;
    }> = [
      {
        status: GitFileStatusCode.BOTH_ADDED,
        showDeleteFile: false,
        showKeepBase: false,
        showKeepLocal: true,
        showKeepRemote: true,
        deleteFileLabel: "Delete File",
      },
      {
        status: GitFileStatusCode.BOTH_DELETED,
        showDeleteFile: true,
        showKeepBase: false,
        showKeepLocal: false,
        showKeepRemote: false,
        deleteFileLabel: "Delete File",
      },
      {
        // Handled by a different UI component.
        status: GitFileStatusCode.BOTH_MODIFIED,
        showDeleteFile: false,
        showKeepBase: false,
        showKeepLocal: false,
        showKeepRemote: false,
        deleteFileLabel: "Delete File",
      },
      {
        status: GitFileStatusCode.ADDED_LOCALLY,
        showDeleteFile: true,
        showKeepBase: false,
        showKeepLocal: true,
        showKeepRemote: false,
        deleteFileLabel: "Delete File (Keep Remote)",
      },
      {
        status: GitFileStatusCode.ADDED_REMOTELY,
        showDeleteFile: true,
        showKeepBase: false,
        showKeepLocal: false,
        showKeepRemote: true,
        deleteFileLabel: "Delete File (Keep Local)",
      },
      {
        status: GitFileStatusCode.DELETED_LOCALLY,
        showDeleteFile: true,
        showKeepBase: true,
        showKeepLocal: false,
        showKeepRemote: true,
        deleteFileLabel: "Delete File (Keep Local)",
      },
      {
        status: GitFileStatusCode.DELETED_REMOTELY,
        showDeleteFile: true,
        showKeepBase: true,
        showKeepLocal: true,
        showKeepRemote: false,
        deleteFileLabel: "Delete File (Keep Remote)",
      },
    ];

    for (const testCase of cases) {
      setStatus(testCase.status);

      expect(component.showDeleteFile()).toBe(testCase.showDeleteFile);
      expect(component.showKeepBase()).toBe(testCase.showKeepBase);
      expect(component.showKeepLocal()).toBe(testCase.showKeepLocal);
      expect(component.showKeepRemote()).toBe(testCase.showKeepRemote);
      expect(component.deleteFileLabel()).toBe(testCase.deleteFileLabel);
    }
  });
});
