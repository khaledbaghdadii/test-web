import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of, throwError } from "rxjs";
import {
  CommitsService,
  Development,
  MergeRequestService,
  MergeRequestState,
} from "@mxevolve/domains/scm/data-access";
import { BranchDetailsFacadeService } from "./branch-details-facade.service";

const MOCK_DEVELOPMENT: Development = {
  id: "dev-1",
  name: "feature/x",
  source: "main",
  projectId: "p1",
  repository: { id: "repo-1", url: "" },
  latestCommitId: "a",
  parentCommitId: "b",
  createdOn: "2024-01-01",
  deleted: false,
};

describe("BranchDetailsFacadeService", () => {
  let facade: BranchDetailsFacadeService;
  const mergeRequestService = { getFilteredMergeRequests: jest.fn() };
  const commitsService = { getCommitDifferences: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        BranchDetailsFacadeService,
        { provide: MergeRequestService, useValue: mergeRequestService },
        { provide: CommitsService, useValue: commitsService },
      ],
    });
    facade = TestBed.inject(BranchDetailsFacadeService);
  });

  describe("getLatestMergeRequest", () => {
    it("returns the most recently created merge request", async () => {
      mergeRequestService.getFilteredMergeRequests.mockReturnValue(
        of([
          {
            pullRequestId: "old",
            mergeRequestState: MergeRequestState.MERGED,
            createdOn: "2024-01-01",
          },
          {
            pullRequestId: "new",
            mergeRequestState: MergeRequestState.MERGED,
            createdOn: "2024-06-01",
          },
        ])
      );

      const result = await firstValueFrom(
        facade.getLatestMergeRequest("p1", "d1", "c1")
      );

      expect(mergeRequestService.getFilteredMergeRequests).toHaveBeenCalledWith(
        "p1",
        { developmentId: "d1", contextId: "c1" }
      );
      expect(result?.pullRequestId).toBe("new");
    });

    it("returns undefined when there are no merge requests", async () => {
      mergeRequestService.getFilteredMergeRequests.mockReturnValue(of([]));

      const result = await firstValueFrom(
        facade.getLatestMergeRequest("p1", "d1", "c1")
      );

      expect(result).toBeUndefined();
    });

    it("returns undefined when the lookup fails", async () => {
      mergeRequestService.getFilteredMergeRequests.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      const result = await firstValueFrom(
        facade.getLatestMergeRequest("p1", "d1", "c1")
      );

      expect(result).toBeUndefined();
    });
  });

  describe("commitsBehindParams", () => {
    it("builds request params for a valid development", () => {
      expect(facade.commitsBehindParams(MOCK_DEVELOPMENT, "p1")).toEqual({
        projectId: "p1",
        repositoryId: "repo-1",
        sourceBranch: "main",
        destinationBranch: "feature/x",
      });
    });

    it("returns undefined when development is undefined", () => {
      expect(facade.commitsBehindParams(undefined, "p1")).toBeUndefined();
    });

    it("returns undefined when the branch is deleted", () => {
      expect(
        facade.commitsBehindParams({ ...MOCK_DEVELOPMENT, deleted: true }, "p1")
      ).toBeUndefined();
    });

    it("returns undefined when there is no source branch", () => {
      expect(
        facade.commitsBehindParams(
          { ...MOCK_DEVELOPMENT, source: undefined },
          "p1"
        )
      ).toBeUndefined();
    });
  });

  describe("getCommitsBehind", () => {
    const params = {
      projectId: "p1",
      repositoryId: "repo-1",
      sourceBranch: "main",
      destinationBranch: "feature/x",
    };

    it("delegates to the commits service", async () => {
      commitsService.getCommitDifferences.mockReturnValue(of([{ id: "c1" }]));

      const result = await firstValueFrom(facade.getCommitsBehind(params));

      expect(commitsService.getCommitDifferences).toHaveBeenCalledWith(params);
      expect(result).toEqual([{ id: "c1" }]);
    });

    it("propagates errors", async () => {
      commitsService.getCommitDifferences.mockReturnValue(
        throwError(() => new Error("fail"))
      );

      await expect(
        firstValueFrom(facade.getCommitsBehind(params))
      ).rejects.toThrow("fail");
    });
  });
});
