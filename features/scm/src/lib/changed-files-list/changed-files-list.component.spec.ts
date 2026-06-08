import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { DomTestUtils } from "@mxevolve/testing";
import { of, Subject, throwError } from "rxjs";
import { ChangedFilesListComponent } from "./changed-files-list.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { GitFileStatusCode } from "../remote-cloned-repository/model";
import { ChangedFileApiResponse } from "../remote-cloned-repository/response/changed-file-api-response";

const PROJECT_ID = "test-project-id";
const REPOSITORY_ID = "test-repository-id";

const CHANGED_FILES_RESPONSE: ChangedFileApiResponse[] = [
  {
    path: "src/app/component.ts",
    gitFileStatusCode: GitFileStatusCode.WORKTREE_MODIFIED,
  },
  {
    path: "new-file.ts",
    gitFileStatusCode: GitFileStatusCode.INDEX_ADDED,
  },
  {
    path: "src/old/removed.ts",
    gitFileStatusCode: GitFileStatusCode.INDEX_DELETED,
  },
];

describe("ChangedFilesListComponent", () => {
  let remoteClonedRepositoryService: jest.Mocked<RemoteClonedRepositoryService>;
  let fixture: ComponentFixture<ChangedFilesListComponent>;

  beforeEach(async () => {
    remoteClonedRepositoryService = {
      getChangedFiles: jest.fn(() => of(CHANGED_FILES_RESPONSE)),
    } as unknown as jest.Mocked<RemoteClonedRepositoryService>;

    await TestBed.configureTestingModule({
      imports: [ChangedFilesListComponent],
    })
      .overrideComponent(ChangedFilesListComponent, {
        add: {
          providers: [
            {
              provide: RemoteClonedRepositoryService,
              useValue: remoteClonedRepositoryService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChangedFilesListComponent);
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("repositoryId", REPOSITORY_ID);
  });

  describe("fetching", () => {
    it("should fetch changed files on init", () => {
      fixture.detectChanges();

      expect(
        remoteClonedRepositoryService.getChangedFiles
      ).toHaveBeenCalledWith(PROJECT_ID, REPOSITORY_ID);
    });

    it("should show loading state while fetching", () => {
      const fetchSubject = new Subject<ChangedFileApiResponse[]>();
      remoteClonedRepositoryService.getChangedFiles.mockReturnValue(
        fetchSubject.asObservable()
      );

      fixture.detectChanges();

      expect(getElement("changed-files-skeleton").isRendered()).toBe(true);

      fetchSubject.next([]);
      fetchSubject.complete();
      fixture.detectChanges();

      expect(getElement("changed-files-skeleton").isRendered()).toBe(false);
    });

    it("should stop loading when fetch fails", () => {
      remoteClonedRepositoryService.getChangedFiles.mockReturnValue(
        throwError(() => new Error("network error"))
      );

      fixture.detectChanges();

      expect(getElement("changed-files-skeleton").isRendered()).toBe(false);
      expect(getElement("changed-files-section").isRendered()).toBe(false);
    });

    it("should exclude non-change status files", () => {
      remoteClonedRepositoryService.getChangedFiles.mockReturnValue(
        of([
          {
            path: "src/unchanged.ts",
            gitFileStatusCode: GitFileStatusCode.UNKNOWN,
          },
          {
            path: "src/modified.ts",
            gitFileStatusCode: GitFileStatusCode.WORKTREE_MODIFIED,
          },
        ])
      );

      fixture.detectChanges();

      expect(getAllEntries()).toHaveLength(1);
    });
  });

  describe("rendering", () => {
    it("should render nothing when no changed files are returned", () => {
      remoteClonedRepositoryService.getChangedFiles.mockReturnValue(of([]));

      fixture.detectChanges();

      expect(getElement("changed-files-skeleton").isRendered()).toBe(false);
      expect(getElement("changed-files-section").isRendered()).toBe(false);
    });

    it("should render file entries when files are returned", () => {
      fixture.detectChanges();

      expect(getAllEntries()).toHaveLength(3);
    });

    it("should display correct count in the header", () => {
      fixture.detectChanges();

      const header = getElement("changed-files-section").getNativeElement();
      expect(header.textContent).toContain("Changes (3)");
    });

    it("should render status label with correct color class", () => {
      fixture.detectChanges();

      const status = getElement("changed-file-status").getNativeElement();
      expect(status.textContent.trim()).toBe("M");
      expect(status.classList).toContain("text-orange-400");
    });

    it("should render file name and directory", () => {
      fixture.detectChanges();

      const entry = getElement("changed-file-entry").getNativeElement();
      expect(entry.textContent).toContain("component.ts");
      expect(entry.textContent).toContain("src/app");
    });

    it("should not render directory when file is at root level", () => {
      remoteClonedRepositoryService.getChangedFiles.mockReturnValue(
        of([
          {
            path: "root-file.ts",
            gitFileStatusCode: GitFileStatusCode.INDEX_ADDED,
          },
        ])
      );

      fixture.detectChanges();

      const entry = getElement("changed-file-entry").getNativeElement();
      const directorySpan = entry.querySelector(".text-gray-400.text-xs");
      expect(directorySpan).toBeNull();
    });
  });

  function getElement(testId: string) {
    return DomTestUtils.getElementByTestId(fixture, testId);
  }

  function getAllEntries() {
    fixture.detectChanges();
    return fixture.debugElement.queryAll(
      By.css('[data-testid="changed-file-entry"]')
    );
  }
});
