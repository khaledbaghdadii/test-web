import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of, throwError } from "rxjs";
import {
  FinalProduct,
  FinalProductApiService,
  FinalProducts,
} from "@mxevolve/domains/artifact/data-access";
import {
  CommitsService,
  DevelopmentService,
} from "@mxevolve/domains/scm/data-access";
import {
  LatestFinalProductFailureReason,
  LatestFinalProductFetcherService,
} from "./latest-final-product-fetcher.service";

const REQUEST = {
  projectId: "project-1",
  repositoryId: "repo-1",
  branchName: "archival-1",
};

const mockDevelopmentService = { getDevelopments: jest.fn() };
const mockCommitsService = { getCommitDifferences: jest.fn() };
const mockFinalProductApiService = { getFinalProducts: jest.fn() };

function development(overrides: Record<string, unknown> = {}) {
  return {
    content: [
      {
        id: "dev-1",
        name: "archival-1",
        source: "main",
        projectId: "project-1",
        repositoryId: "repo-1",
        parentCommitId: "parent-commit",
        deleted: false,
        ...overrides,
      },
    ],
  };
}

function finalProduct(id: string): FinalProduct {
  return { id, configurationCommitId: `${id}-commit` } as FinalProduct;
}

function page(content: FinalProduct[]): FinalProducts {
  return {
    content,
    totalPages: 1,
    totalElements: content.length,
    size: 50,
    number: 0,
    last: true,
  };
}

/** Resolves final products per commit id; anything not listed comes back empty. */
function finalProductsByCommit(byCommit: Record<string, FinalProduct>) {
  mockFinalProductApiService.getFinalProducts.mockImplementation(
    (_projectId: string, filters: { configurationCommitIdFilter: string }) =>
      of(
        page(
          byCommit[filters.configurationCommitIdFilter]
            ? [byCommit[filters.configurationCommitIdFilter]]
            : []
        )
      )
  );
}

describe("LatestFinalProductFetcherService", () => {
  let service: LatestFinalProductFetcherService;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        LatestFinalProductFetcherService,
        { provide: DevelopmentService, useValue: mockDevelopmentService },
        { provide: CommitsService, useValue: mockCommitsService },
        {
          provide: FinalProductApiService,
          useValue: mockFinalProductApiService,
        },
      ],
    });
    service = TestBed.inject(LatestFinalProductFetcherService);
  });

  it("reports an invalid branch when the branch is unknown to SCM", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(of({ content: [] }));

    const result = await firstValueFrom(
      service.getLatestFinalProductOnBranch(REQUEST)
    );

    expect(result.failureReason).toBe(
      LatestFinalProductFailureReason.INVALID_BRANCH_NAME
    );
  });

  it("reports an invalid branch when the branch has no parent branch", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(
      of(development({ source: undefined }))
    );

    const result = await firstValueFrom(
      service.getLatestFinalProductOnBranch(REQUEST)
    );

    expect(result.failureReason).toBe(
      LatestFinalProductFailureReason.INVALID_BRANCH_NAME
    );
  });

  it("returns the final product of the newest commit that has one", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(of(development()));
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ id: "commit-newest" }, { id: "commit-older" }])
    );
    finalProductsByCommit({ "commit-older": finalProduct("fp-older") });

    const result = await firstValueFrom(
      service.getLatestFinalProductOnBranch(REQUEST)
    );

    expect(result.finalProduct?.id).toBe("fp-older");
  });

  it("stops looking once a commit with a final product is found", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(of(development()));
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ id: "commit-newest" }, { id: "commit-older" }])
    );
    finalProductsByCommit({ "commit-newest": finalProduct("fp-newest") });

    await firstValueFrom(service.getLatestFinalProductOnBranch(REQUEST));

    expect(mockFinalProductApiService.getFinalProducts).toHaveBeenCalledTimes(
      1
    );
  });

  it("scopes the per-commit lookup to the archival branch", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(of(development()));
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ id: "commit-newest" }])
    );
    finalProductsByCommit({ "commit-newest": finalProduct("fp-newest") });

    await firstValueFrom(service.getLatestFinalProductOnBranch(REQUEST));

    expect(mockFinalProductApiService.getFinalProducts).toHaveBeenCalledWith(
      "project-1",
      {
        branchFilter: "archival-1",
        configurationCommitIdFilter: "commit-newest",
        sort: "createdOn,desc",
      }
    );
  });

  it("falls back to the parent commit when no branch commit carries a final product", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(of(development()));
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ id: "commit-newest" }])
    );
    finalProductsByCommit({ "parent-commit": finalProduct("fp-parent") });

    const result = await firstValueFrom(
      service.getLatestFinalProductOnBranch(REQUEST)
    );

    expect(result.finalProduct?.id).toBe("fp-parent");
  });

  it("looks the parent commit up across all branches", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(of(development()));
    mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
    finalProductsByCommit({ "parent-commit": finalProduct("fp-parent") });

    await firstValueFrom(service.getLatestFinalProductOnBranch(REQUEST));

    expect(mockFinalProductApiService.getFinalProducts).toHaveBeenCalledWith(
      "project-1",
      {
        branchFilter: undefined,
        configurationCommitIdFilter: "parent-commit",
        sort: "createdOn,desc",
      }
    );
  });

  it("reports that no final product exists when neither the branch nor its parent has one", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(of(development()));
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ id: "commit-newest" }])
    );
    finalProductsByCommit({});

    const result = await firstValueFrom(
      service.getLatestFinalProductOnBranch(REQUEST)
    );

    expect(result.failureReason).toBe(
      LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND
    );
  });

  it("reports an unexpected failure when the developments lookup fails", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(
      throwError(() => new Error("boom"))
    );

    const result = await firstValueFrom(
      service.getLatestFinalProductOnBranch(REQUEST)
    );

    expect(result.failureReason).toBe(
      LatestFinalProductFailureReason.UNEXPECTED_FAILURE
    );
  });

  it("reports an unexpected failure when the final-product lookup fails", async () => {
    mockDevelopmentService.getDevelopments.mockReturnValue(of(development()));
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ id: "commit-newest" }])
    );
    mockFinalProductApiService.getFinalProducts.mockReturnValue(
      throwError(() => new Error("boom"))
    );

    const result = await firstValueFrom(
      service.getLatestFinalProductOnBranch(REQUEST)
    );

    expect(result.failureReason).toBe(
      LatestFinalProductFailureReason.UNEXPECTED_FAILURE
    );
  });
});
