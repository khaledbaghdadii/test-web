import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DevelopmentDetailsComponent } from "./development-details.component";
import { ScmService } from "../../../../scm/src/lib/scm.service";
import { ScmManagementService } from "../../../../scm/src/lib/scm-management.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CommitDetails, Development } from "@mxflow/features/scm";

describe("DevelopmentDetailsComponent", () => {
  let component: DevelopmentDetailsComponent;
  let fixture: ComponentFixture<DevelopmentDetailsComponent>;
  let mockScmService: jest.Mocked<ScmService>;
  let mockScmManagementService: jest.Mocked<ScmManagementService>;
  let mockToastMessageService: jest.Mocked<ToastMessageService>;

  const DEV_ID = "dev-123";
  const DEV_BRANCH_NAME = "feature-branch";
  const DEV_PARENT_BRANCH_NAME = "main";
  const DEV_PROJECT_ID = "proj-456";
  const DEV_REPOSITORY_ID = "repo-789";
  const DEV_REPOSITORY_URL = "https://github.com/example/repo.git";
  const DEV_LATEST_COMMIT_ID = "commit-abc";
  const DEV_CREATED_ON = "2024-01-15T10:00:00Z";
  const DEV_PARENT_COMMIT_ID = "parent-def";
  const mockDevelopment: Development = {
    deleted: false,
    id: DEV_ID,
    name: DEV_BRANCH_NAME,
    source: DEV_PARENT_BRANCH_NAME,
    projectId: DEV_PROJECT_ID,
    repository: {
      id: DEV_REPOSITORY_ID,
      url: DEV_REPOSITORY_URL,
    },
    latestCommitId: DEV_LATEST_COMMIT_ID,
    createdOn: DEV_CREATED_ON,
    parentCommitId: DEV_PARENT_COMMIT_ID,
  };

  const mockCommitDifferences: CommitDetails[] = [
    {
      id: "commit-1",
      committerDisplayName: "John Doe",
      committerDisplayEmail: "john@example.com",
      timeStamp: "2024-01-14T10:00:00Z",
      message: "Add new feature",
      url: "https://github.com/example/repo/commit/commit-1",
    },
    {
      id: "commit-2",
      committerDisplayName: "Jane Smith",
      committerDisplayEmail: "jane@example.com",
      timeStamp: "2024-01-13T10:00:00Z",
      message: "Fix bug",
      url: "https://github.com/example/repo/commit/commit-2",
    },
  ];

  beforeEach(async () => {
    mockScmService = {
      getCommitDifferences: jest.fn(),
    } as any;

    mockScmManagementService = {
      getDevelopment: jest.fn(),
    } as any;

    mockToastMessageService = {
      showError: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [DevelopmentDetailsComponent],
      providers: [
        { provide: ScmService, useValue: mockScmService },
        { provide: ScmManagementService, useValue: mockScmManagementService },
        { provide: ToastMessageService, useValue: mockToastMessageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DevelopmentDetailsComponent);
    component = fixture.componentInstance;
  });

  describe("Component Initialization", () => {
    it("should create", () => {
      expect(component).toBeTruthy();
    });

    it("should initialize signals with default values", () => {
      expect(component.configurationParentBranch()).toBeUndefined();
      expect(component.configurationBranchName()).toBe("");
      expect(component.createdAt()).toBeUndefined();
      expect(component.repositoryUrl()).toBe("");
      expect(component.repositoryId()).toBeUndefined();
    });

    it("should initialize toSignal properties with initial values", () => {
      expect(component.developmentDetails()).toBeNull();
      expect(component.commitDifferences()).toEqual([]);
    });
  });

  describe("Development Details Loading", () => {
    beforeEach(() => {
      component.projectId = DEV_PROJECT_ID;
      component.developmentId = DEV_ID;
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(mockDevelopment)
      );
      mockScmService.getCommitDifferences.mockReturnValue(
        of(mockCommitDifferences)
      );
    });

    it("should call getDevelopment with correct parameters", fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockScmManagementService.getDevelopment).toHaveBeenCalledWith(
        DEV_PROJECT_ID,
        DEV_ID,
        true
      );
    }));

    it("should update signals when development details are loaded", fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.configurationParentBranch()).toBe(
        DEV_PARENT_BRANCH_NAME
      );
      expect(component.configurationBranchName()).toBe(DEV_BRANCH_NAME);
      expect(component.createdAt()).toBe(DEV_CREATED_ON);
      expect(component.repositoryUrl()).toBe(DEV_REPOSITORY_URL);
      expect(component.repositoryId()).toBe(DEV_REPOSITORY_ID);
    }));

    it("should handle getDevelopment error", fakeAsync(() => {
      const error = new Error("API Error");
      mockScmManagementService.getDevelopment.mockReturnValue(
        throwError(() => error)
      );

      fixture.detectChanges();
      tick();

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Failed to load development details"
      );
      expect(component.developmentDetails()).toBeNull();
    }));
  });

  describe("Commit Differences Loading", () => {
    beforeEach(() => {
      component.projectId = DEV_PROJECT_ID;
      component.developmentId = DEV_ID;
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(mockDevelopment)
      );
    });

    it("should call getCommitDifferences with correct parameters", fakeAsync(() => {
      mockScmService.getCommitDifferences.mockReturnValue(
        of(mockCommitDifferences)
      );

      fixture.detectChanges();
      tick();

      expect(mockScmService.getCommitDifferences).toHaveBeenCalledWith({
        projectId: DEV_PROJECT_ID,
        repositoryId: DEV_REPOSITORY_ID,
        sourceBranch: DEV_PARENT_BRANCH_NAME,
        destinationBranch: DEV_BRANCH_NAME,
      });
    }));

    it("should update commitDifferences signal", fakeAsync(() => {
      mockScmService.getCommitDifferences.mockReturnValue(
        of(mockCommitDifferences)
      );

      fixture.detectChanges();
      tick();

      expect(component.commitDifferences()).toEqual(mockCommitDifferences);
    }));

    it("should handle getCommitDifferences error", fakeAsync(() => {
      const error = new Error("Commit API Error");
      mockScmService.getCommitDifferences.mockReturnValue(
        throwError(() => error)
      );

      fixture.detectChanges();
      tick();

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Couldn't retrieve commit differences: " + error
      );
      expect(component.commitDifferences()).toEqual([]);
    }));

    it("should return empty commit differences when development is deleted", fakeAsync(() => {
      const deletedDevelopment: Development = {
        ...mockDevelopment,
        deleted: true,
      };

      mockScmManagementService.getDevelopment.mockReturnValue(
        of(deletedDevelopment)
      );

      fixture.detectChanges();
      tick();

      expect(component.commitDifferences()).toEqual([]);
      expect(mockScmService.getCommitDifferences).not.toHaveBeenCalled();
    }));
  });

  describe("Computed Properties", () => {
    beforeEach(() => {
      component.projectId = DEV_PROJECT_ID;
      component.developmentId = DEV_ID;
      mockScmManagementService.getDevelopment.mockReturnValue(
        of(mockDevelopment)
      );
    });

    describe("numberOfCommitsBehindMain", () => {
      it("should return correct number of commits", fakeAsync(() => {
        mockScmService.getCommitDifferences.mockReturnValue(
          of(mockCommitDifferences)
        );

        fixture.detectChanges();
        tick();

        expect(component.numberOfCommitsBehindMain()).toBe(2);
      }));

      it("should return 0 when no commit differences", fakeAsync(() => {
        mockScmService.getCommitDifferences.mockReturnValue(of([]));

        fixture.detectChanges();
        tick();

        expect(component.numberOfCommitsBehindMain()).toBe(0);
      }));
    });

    describe("branchStatusMessage", () => {
      it("should return up-to-date message when no commits behind", fakeAsync(() => {
        mockScmService.getCommitDifferences.mockReturnValue(of([]));

        fixture.detectChanges();
        tick();

        expect(component.branchStatusMessage()).toBe(
          "Your branch feature-branch is up to date with main"
        );
      }));

      it("should return behind message with single commit", fakeAsync(() => {
        mockScmService.getCommitDifferences.mockReturnValue(
          of([mockCommitDifferences[0]])
        );

        fixture.detectChanges();
        tick();

        expect(component.branchStatusMessage()).toBe(
          "Your branch feature-branch is 1 commit behind main"
        );
      }));

      it("should return behind message with multiple commits", fakeAsync(() => {
        mockScmService.getCommitDifferences.mockReturnValue(
          of(mockCommitDifferences)
        );

        fixture.detectChanges();
        tick();

        expect(component.branchStatusMessage()).toBe(
          "Your branch feature-branch is 2 commits behind main"
        );
      }));

      it("should return empty string when branch name is missing", () => {
        component.configurationBranchName.set("");
        component.configurationParentBranch.set(DEV_PARENT_BRANCH_NAME);

        expect(component.branchStatusMessage()).toBe("");
      });

      it("should return empty string when parent branch is missing", () => {
        component.configurationBranchName.set(DEV_BRANCH_NAME);
        component.configurationParentBranch.set(undefined);

        expect(component.branchStatusMessage()).toBe("");
      });
    });
  });

  describe("Input Changes", () => {
    it("should trigger new API calls when inputs change", fakeAsync(() => {
      const mockDevelopment2: Development = {
        ...mockDevelopment,
        id: "dev-456",
        projectId: "proj-789",
      };

      mockScmManagementService.getDevelopment
        .mockReturnValueOnce(of(mockDevelopment))
        .mockReturnValueOnce(of(mockDevelopment2));

      mockScmService.getCommitDifferences.mockReturnValue(
        of(mockCommitDifferences)
      );

      fixture.componentRef.setInput("projectId", DEV_PROJECT_ID);
      fixture.componentRef.setInput("developmentId", DEV_ID);
      fixture.detectChanges();
      tick();

      expect(mockScmManagementService.getDevelopment).toHaveBeenCalledTimes(1);
      expect(mockScmManagementService.getDevelopment).toHaveBeenCalledWith(
        DEV_PROJECT_ID,
        DEV_ID,
        true
      );

      fixture.componentRef.setInput("projectId", "proj-789");
      fixture.componentRef.setInput("developmentId", "dev-456");
      fixture.detectChanges();
      tick();

      expect(mockScmManagementService.getDevelopment).toHaveBeenCalledTimes(2);
      expect(mockScmManagementService.getDevelopment).toHaveBeenLastCalledWith(
        "proj-789",
        "dev-456",
        true
      );
    }));
  });

  describe("Bitbucket URL Building", () => {
    describe("repositoryUrlWithBranch", () => {
      it("should return empty string when development details are not loaded", () => {
        expect(component.repositoryUrlWithBranch()).toBe("");
      });

      it("should build correct Bitbucket URL with SCM format", fakeAsync(() => {
        const scmUrl = "https://example.com/scm/project/repo.git";
        const branchName = "test/testbranch";
        const mockDev: Development = {
          ...mockDevelopment,
          repository: { id: "repo-1", url: scmUrl },
          name: branchName,
        };

        mockScmManagementService.getDevelopment.mockReturnValue(of(mockDev));
        mockScmService.getCommitDifferences.mockReturnValue(of([]));

        component.projectId = DEV_PROJECT_ID;
        component.developmentId = DEV_ID;
        fixture.detectChanges();
        tick();

        const expectedUrl =
          "https://example.com/projects/PROJECT/repos/repo/browse?at=refs%2Fheads%2Ftest%2Ftestbranch";
        expect(component.repositoryUrlWithBranch()).toBe(expectedUrl);
      }));

      it("should return empty string when repositoryUrl is empty", fakeAsync(() => {
        const mockDev: Development = {
          ...mockDevelopment,
          repository: { id: "repo-1", url: "" },
          name: "branch-name",
        };

        mockScmManagementService.getDevelopment.mockReturnValue(of(mockDev));
        mockScmService.getCommitDifferences.mockReturnValue(of([]));

        component.projectId = DEV_PROJECT_ID;
        component.developmentId = DEV_ID;
        fixture.detectChanges();
        tick();

        expect(component.repositoryUrlWithBranch()).toBe("");
      }));

      it("should return repositoryUrl when branchName is empty", fakeAsync(() => {
        const repoUrl = "https://bitbucket.example.com/scm/proj/repo.git";
        const mockDev: Development = {
          ...mockDevelopment,
          repository: { id: "repo-1", url: repoUrl },
          name: "",
        };

        mockScmManagementService.getDevelopment.mockReturnValue(of(mockDev));
        mockScmService.getCommitDifferences.mockReturnValue(of([]));

        component.projectId = DEV_PROJECT_ID;
        component.developmentId = DEV_ID;
        fixture.detectChanges();
        tick();

        expect(component.repositoryUrlWithBranch()).toBe(
          "https://bitbucket.example.com/projects/PROJ/repos/repo/browse"
        );
      }));
    });
    describe("repositoryUrlWithParentBranch", () => {
      it("should return empty string when development details are not loaded", () => {
        expect(component.repositoryUrlWithParentBranch()).toBe("");
      });

      it("should build correct Bitbucket URL for parent branch", fakeAsync(() => {
        const scmUrl = "https://example.com/scm/project/repo.git";
        const parentBranch = "test/testbranch";
        const mockDev: Development = {
          ...mockDevelopment,
          repository: { id: "repo-1", url: scmUrl },
          source: parentBranch,
        };

        mockScmManagementService.getDevelopment.mockReturnValue(of(mockDev));
        mockScmService.getCommitDifferences.mockReturnValue(of([]));

        component.projectId = DEV_PROJECT_ID;
        component.developmentId = DEV_ID;
        fixture.detectChanges();
        tick();

        const expectedUrl =
          "https://example.com/projects/PROJECT/repos/repo/browse?at=refs%2Fheads%2Ftest%2Ftestbranch";
        expect(component.repositoryUrlWithParentBranch()).toBe(expectedUrl);
      }));

      it("should return cleaned browse URL when source branch is empty string", fakeAsync(() => {
        const scmUrl = "https://bitbucket.example.com/scm/proj/repo.git";
        const mockDev: Development = {
          ...mockDevelopment,
          repository: { id: "repo-1", url: scmUrl },
          source: "",
        };

        mockScmManagementService.getDevelopment.mockReturnValue(of(mockDev));
        mockScmService.getCommitDifferences.mockReturnValue(of([]));

        component.projectId = DEV_PROJECT_ID;
        component.developmentId = DEV_ID;
        fixture.detectChanges();
        tick();

        expect(component.repositoryUrlWithParentBranch()).toBe(
          "https://bitbucket.example.com/projects/PROJ/repos/repo/browse"
        );
      }));
    });
  });
});
