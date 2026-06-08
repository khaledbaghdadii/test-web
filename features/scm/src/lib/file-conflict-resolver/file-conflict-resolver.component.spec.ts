import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of, Subject, throwError } from "rxjs";
import { Message } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { SplitterModule } from "primeng/splitter";
import { FileConflictResolverComponent } from "./file-conflict-resolver.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { DiffVersion } from "../remote-cloned-repository/model/diff-version.enum";
import { GitFileStatusCode } from "../remote-cloned-repository/model/git-file-status-code.enum";
import {
  ConflictResolutionDecision,
  ConflictResolutionDecisionType,
} from "../conflict-resolution-buttons/model/conflict-resolution-decision.model";
import { GetConflictingDiffVersionsApiResponse } from "../remote-cloned-repository/response/get-conflicting-diff-versions-api-response";
import { ReadRemoteFileContentApiResponse } from "../remote-cloned-repository/response/read-remote-file-content-api-response";

const PROJECT_ID = "project-1";
const REPOSITORY_ID = "repository-1";
const FILE_PATH = "config/application.yaml";
const UNKNOWN_EXTENSION_FILE_PATH = "config/application.unknown";
const BASE_CONTENT = "base-content";
const LOCAL_CONTENT = "local-content";
const REMOTE_CONTENT = "remote-content";
const WORKING_TREE_CONTENT = "working-tree-content";
const ERROR_MESSAGE = "load failed";

const EXPECTED_READ_FILE_REQUEST = {
  projectId: PROJECT_ID,
  remoteClonedRepositoryId: REPOSITORY_ID,
  filePath: FILE_PATH,
};

const EXPECTED_GET_DIFF_VERSIONS_REQUEST = {
  projectId: PROJECT_ID,
  remoteClonedRepositoryId: REPOSITORY_ID,
  filePath: FILE_PATH,
  requestedDiffVersions: [
    DiffVersion.BASE,
    DiffVersion.LOCAL,
    DiffVersion.REMOTE,
  ],
};

const EXPECTED_GET_DIFF_VERSIONS_REQUEST_BOTH_ADDED = {
  projectId: PROJECT_ID,
  remoteClonedRepositoryId: REPOSITORY_ID,
  filePath: FILE_PATH,
  requestedDiffVersions: [DiffVersion.LOCAL, DiffVersion.REMOTE],
};

const EXPECTED_GET_DIFF_VERSIONS_REQUEST_DELETED_LOCALLY = {
  projectId: PROJECT_ID,
  remoteClonedRepositoryId: REPOSITORY_ID,
  filePath: FILE_PATH,
  requestedDiffVersions: [DiffVersion.BASE, DiffVersion.REMOTE],
};

const EXPECTED_GET_DIFF_VERSIONS_REQUEST_DELETED_REMOTELY = {
  projectId: PROJECT_ID,
  remoteClonedRepositoryId: REPOSITORY_ID,
  filePath: FILE_PATH,
  requestedDiffVersions: [DiffVersion.BASE, DiffVersion.LOCAL],
};

const DIFF_VERSIONS_RESPONSE: GetConflictingDiffVersionsApiResponse = {
  versionContents: {
    [DiffVersion.BASE]: BASE_CONTENT,
    [DiffVersion.LOCAL]: LOCAL_CONTENT,
    [DiffVersion.REMOTE]: REMOTE_CONTENT,
  },
};

const DIFF_VERSIONS_WITHOUT_LOCAL_RESPONSE: GetConflictingDiffVersionsApiResponse =
  {
    versionContents: {
      [DiffVersion.BASE]: BASE_CONTENT,
      [DiffVersion.REMOTE]: REMOTE_CONTENT,
    },
  };

const READ_FILE_RESPONSE: ReadRemoteFileContentApiResponse = {
  payload: WORKING_TREE_CONTENT,
};

@Component({
  selector: "mxevolve-base-comparison-diffs",
  standalone: true,
  template: "",
})
class MockBaseComparisonDiffsComponent {
  @Input({ required: true })
  baseContent!: string;

  @Input()
  localContent: string | null = null;

  @Input()
  remoteContent: string | null = null;

  @Input()
  language = "plaintext";
}

@Component({
  selector: "mxevolve-conflict-resolution-container",
  standalone: true,
  template: "",
})
class MockConflictResolutionContainerComponent {
  @Input({ required: true })
  projectId!: string;

  @Input({ required: true })
  remoteClonedRepositoryId!: string;

  @Input({ required: true })
  filePath!: string;

  @Input()
  language = "plaintext";

  @Input({ required: true })
  rawConflictContent!: string;

  @Input({ required: true })
  gitFileStatusCode!: GitFileStatusCode;

  @Input()
  resolvedContentByDecision: Partial<
    Record<ConflictResolutionDecisionType, string>
  > = {};

  @Output()
  decisionTaken = new EventEmitter<ConflictResolutionDecision>();

  @Output()
  resolvedContent = new EventEmitter<string>();
}

describe("FileConflictResolverComponent", () => {
  type MockRemoteClonedRepositoryService = Pick<
    RemoteClonedRepositoryService,
    "getConflictingDiffVersions" | "readRemoteFileContent"
  >;

  let fixture: ComponentFixture<FileConflictResolverComponent>;
  let component: FileConflictResolverComponent;
  let remoteClonedRepositoryServiceMock: jest.Mocked<MockRemoteClonedRepositoryService>;

  const detectAndStabilize = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    remoteClonedRepositoryServiceMock = {
      getConflictingDiffVersions: jest
        .fn()
        .mockReturnValue(of(DIFF_VERSIONS_RESPONSE)),
      readRemoteFileContent: jest.fn().mockReturnValue(of(READ_FILE_RESPONSE)),
    };

    await TestBed.configureTestingModule({
      imports: [FileConflictResolverComponent],
    })
      .overrideComponent(FileConflictResolverComponent, {
        set: {
          imports: [
            Message,
            SkeletonModule,
            SplitterModule,
            MockBaseComparisonDiffsComponent,
            MockConflictResolutionContainerComponent,
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

    fixture = TestBed.createComponent(FileConflictResolverComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("remoteClonedRepositoryId", REPOSITORY_ID);
    fixture.componentRef.setInput("filePath", FILE_PATH);
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.BOTH_MODIFIED
    );
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("should load merge data when required inputs are set", () => {
    const givenReadFileRequest = EXPECTED_READ_FILE_REQUEST;
    const givenGetDiffVersionsRequest = EXPECTED_GET_DIFF_VERSIONS_REQUEST;

    fixture.detectChanges();

    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledWith(givenGetDiffVersionsRequest);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledWith(givenReadFileRequest);
  });

  it("should pass mapped merge data to child components when remote data loads successfully", async () => {
    const givenExpectedResolvedByDecision = {
      [ConflictResolutionDecisionType.KEEP_BASE]: BASE_CONTENT,
      [ConflictResolutionDecisionType.KEEP_LOCAL]: LOCAL_CONTENT,
      [ConflictResolutionDecisionType.KEEP_REMOTE]: REMOTE_CONTENT,
    };

    await detectAndStabilize();

    const whenBaseComparison = fixture.debugElement.query(
      By.directive(MockBaseComparisonDiffsComponent)
    ).componentInstance as MockBaseComparisonDiffsComponent;
    const whenConflictResolutionContainer = fixture.debugElement.query(
      By.directive(MockConflictResolutionContainerComponent)
    ).componentInstance as MockConflictResolutionContainerComponent;

    expect(whenBaseComparison.baseContent).toBe(BASE_CONTENT);
    expect(whenBaseComparison.localContent).toBe(LOCAL_CONTENT);
    expect(whenBaseComparison.remoteContent).toBe(REMOTE_CONTENT);
    expect(whenBaseComparison.language).toBe("yaml");
    expect(whenConflictResolutionContainer.projectId).toBe(PROJECT_ID);
    expect(whenConflictResolutionContainer.remoteClonedRepositoryId).toBe(
      REPOSITORY_ID
    );
    expect(whenConflictResolutionContainer.filePath).toBe(FILE_PATH);
    expect(whenConflictResolutionContainer.language).toBe("yaml");
    expect(whenConflictResolutionContainer.rawConflictContent).toBe(
      WORKING_TREE_CONTENT
    );
    expect(whenConflictResolutionContainer.gitFileStatusCode).toBe(
      GitFileStatusCode.BOTH_MODIFIED
    );
    expect(whenConflictResolutionContainer.resolvedContentByDecision).toEqual(
      givenExpectedResolvedByDecision
    );
  });

  it("should keep only available decision content when local diff content is missing", async () => {
    const givenExpectedResolvedByDecision = {
      [ConflictResolutionDecisionType.KEEP_BASE]: BASE_CONTENT,
      [ConflictResolutionDecisionType.KEEP_REMOTE]: REMOTE_CONTENT,
    };
    remoteClonedRepositoryServiceMock.getConflictingDiffVersions.mockReturnValue(
      of(DIFF_VERSIONS_WITHOUT_LOCAL_RESPONSE)
    );

    await detectAndStabilize();

    const whenConflictResolutionContainer = fixture.debugElement.query(
      By.directive(MockConflictResolutionContainerComponent)
    ).componentInstance as MockConflictResolutionContainerComponent;

    expect(whenConflictResolutionContainer.resolvedContentByDecision).toEqual(
      givenExpectedResolvedByDecision
    );
  });

  it("should use plaintext language when file extension is unknown", async () => {
    fixture.componentRef.setInput("filePath", UNKNOWN_EXTENSION_FILE_PATH);

    await detectAndStabilize();

    const whenBaseComparison = fixture.debugElement.query(
      By.directive(MockBaseComparisonDiffsComponent)
    ).componentInstance as MockBaseComparisonDiffsComponent;

    expect(whenBaseComparison.language).toBe("plaintext");
  });

  it("should use button mode sizing when git status is not text-editor status", () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.DELETED_LOCALLY
    );

    fixture.detectChanges();

    const whenIsButtonsMode = component.isButtonsMode();
    const whenSplitterPanelSizes = component.splitterPanelSizes();

    expect(whenIsButtonsMode).toBe(true);
    expect(whenSplitterPanelSizes).toEqual([92, 8]);
  });

  it("should call readRemoteFileContent when git status is BOTH_ADDED", () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.BOTH_ADDED
    );

    fixture.detectChanges();

    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledWith(EXPECTED_GET_DIFF_VERSIONS_REQUEST_BOTH_ADDED);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledWith(EXPECTED_READ_FILE_REQUEST);
  });

  it("should not call readRemoteFileContent when git status is not text-editor status", () => {
    const nonTextEditorStatuses: Array<{
      status: GitFileStatusCode;
      expectedRequest: {
        projectId: string;
        remoteClonedRepositoryId: string;
        filePath: string;
        requestedDiffVersions: DiffVersion[];
      };
    }> = [
      {
        status: GitFileStatusCode.ADDED_LOCALLY,
        expectedRequest: EXPECTED_GET_DIFF_VERSIONS_REQUEST,
      },
      {
        status: GitFileStatusCode.ADDED_REMOTELY,
        expectedRequest: EXPECTED_GET_DIFF_VERSIONS_REQUEST,
      },
    ];

    for (const { status, expectedRequest } of nonTextEditorStatuses) {
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions.mockClear();
      remoteClonedRepositoryServiceMock.readRemoteFileContent.mockClear();

      fixture.componentRef.setInput("gitFileStatusCode", status);
      fixture.detectChanges();

      expect(
        remoteClonedRepositoryServiceMock.getConflictingDiffVersions
      ).toHaveBeenCalledWith(expectedRequest);
      expect(
        remoteClonedRepositoryServiceMock.readRemoteFileContent
      ).not.toHaveBeenCalled();
    }
  });

  it("should request base and remote diff versions when git status is DELETED_LOCALLY", () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.DELETED_LOCALLY
    );

    fixture.detectChanges();

    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledWith(EXPECTED_GET_DIFF_VERSIONS_REQUEST_DELETED_LOCALLY);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).not.toHaveBeenCalled();
  });

  it("should request base and local diff versions when git status is DELETED_REMOTELY", () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.DELETED_REMOTELY
    );

    fixture.detectChanges();

    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledWith(EXPECTED_GET_DIFF_VERSIONS_REQUEST_DELETED_REMOTELY);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).not.toHaveBeenCalled();
  });

  it("should not request conflicting diff versions when git status is BOTH_DELETED", () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.BOTH_DELETED
    );

    fixture.detectChanges();

    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).not.toHaveBeenCalled();
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).not.toHaveBeenCalled();
  });

  it("should not request conflicting diff versions when git status is INDEX_DELETED", () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.INDEX_DELETED
    );

    fixture.detectChanges();

    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).not.toHaveBeenCalled();
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).not.toHaveBeenCalled();
  });

  it("should show only deleted-file message when content is unavailable", async () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.INDEX_DELETED
    );

    await detectAndStabilize();

    const whenTemplateText = fixture.nativeElement.textContent as string;
    const whenBaseComparison = fixture.debugElement.query(
      By.directive(MockBaseComparisonDiffsComponent)
    );
    const whenConflictResolutionContainer = fixture.debugElement.query(
      By.directive(MockConflictResolutionContainerComponent)
    );

    expect(whenTemplateText).toContain("File is deleted. No content to show.");
    expect(whenBaseComparison).toBeNull();
    expect(whenConflictResolutionContainer).toBeNull();
  });

  it("should show generic unavailable-content message for UNKNOWN status", async () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.UNKNOWN
    );

    await detectAndStabilize();

    const whenTemplateText = fixture.nativeElement.textContent as string;

    expect(whenTemplateText).toContain(
      "File content is unavailable for this status."
    );
    expect(whenTemplateText).not.toContain(
      "File is deleted. No content to show."
    );
  });

  it("should call readRemoteFileContent when git status is BOTH_MODIFIED", () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.BOTH_MODIFIED
    );

    fixture.detectChanges();

    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledWith(EXPECTED_READ_FILE_REQUEST);
  });

  it("should load only working tree content for INDEX_MODIFIED", async () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.INDEX_MODIFIED
    );

    await detectAndStabilize();

    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).not.toHaveBeenCalled();
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledWith(EXPECTED_READ_FILE_REQUEST);

    const whenBaseComparison = fixture.debugElement.query(
      By.directive(MockBaseComparisonDiffsComponent)
    );
    const whenConflictResolutionContainer = fixture.debugElement.query(
      By.directive(MockConflictResolutionContainerComponent)
    ).componentInstance as MockConflictResolutionContainerComponent;

    expect(whenBaseComparison).toBeNull();
    expect(whenConflictResolutionContainer.gitFileStatusCode).toBe(
      GitFileStatusCode.INDEX_MODIFIED
    );
    expect(whenConflictResolutionContainer.rawConflictContent).toBe(
      WORKING_TREE_CONTENT
    );
  });

  it("should use equal splitter sizing when git status is both modified", () => {
    fixture.componentRef.setInput(
      "gitFileStatusCode",
      GitFileStatusCode.BOTH_MODIFIED
    );

    fixture.detectChanges();

    const whenIsButtonsMode = component.isButtonsMode();
    const whenSplitterPanelSizes = component.splitterPanelSizes();

    expect(whenIsButtonsMode).toBe(false);
    expect(whenSplitterPanelSizes).toEqual([50, 50]);
  });

  it("should show loading state when merge requests have not completed", () => {
    const givenDiffVersionsSubject =
      new Subject<GetConflictingDiffVersionsApiResponse>();
    const givenReadFileSubject =
      new Subject<ReadRemoteFileContentApiResponse>();
    remoteClonedRepositoryServiceMock.getConflictingDiffVersions.mockReturnValue(
      givenDiffVersionsSubject.asObservable()
    );
    remoteClonedRepositoryServiceMock.readRemoteFileContent.mockReturnValue(
      givenReadFileSubject.asObservable()
    );

    fixture.detectChanges();

    const whenSkeletons = fixture.nativeElement.querySelectorAll("p-skeleton");
    const whenBaseComparison = fixture.debugElement.query(
      By.directive(MockBaseComparisonDiffsComponent)
    );
    const whenConflictResolution = fixture.debugElement.query(
      By.directive(MockConflictResolutionContainerComponent)
    );

    expect(whenSkeletons.length).toBeGreaterThan(0);
    expect(whenBaseComparison).toBeNull();
    expect(whenConflictResolution).toBeNull();
  });

  it("should show error message when merge request fails", async () => {
    const givenError = new Error(ERROR_MESSAGE);
    remoteClonedRepositoryServiceMock.getConflictingDiffVersions.mockReturnValue(
      throwError(() => givenError)
    );

    await detectAndStabilize();

    const whenTemplateText = fixture.nativeElement.textContent as string;

    expect(whenTemplateText).toContain(
      `Failed to load conflict resolver: ${ERROR_MESSAGE}`
    );
    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledTimes(1);
    // readRemoteFileContent is called because default gitFileStatusCode is BOTH_MODIFIED
  });

  it("should show error message when reading working tree content fails", async () => {
    const givenError = new Error(ERROR_MESSAGE);
    remoteClonedRepositoryServiceMock.readRemoteFileContent.mockReturnValue(
      throwError(() => givenError)
    );

    await detectAndStabilize();

    const whenTemplateText = fixture.nativeElement.textContent as string;

    expect(whenTemplateText).toContain(
      `Failed to load conflict resolver: ${ERROR_MESSAGE}`
    );
    expect(
      remoteClonedRepositoryServiceMock.getConflictingDiffVersions
    ).toHaveBeenCalledTimes(1);
    expect(
      remoteClonedRepositoryServiceMock.readRemoteFileContent
    ).toHaveBeenCalledTimes(1);
  });

  it("should emit resolved event when a decision or editor content is resolved", () => {
    const givenResolvedEmitSpy = jest.spyOn(component.resolved, "emit");

    component.onResolved();
    component.onResolved();

    expect(givenResolvedEmitSpy).toHaveBeenCalledTimes(2);
    expect(givenResolvedEmitSpy).toHaveBeenCalledWith();
  });
});
