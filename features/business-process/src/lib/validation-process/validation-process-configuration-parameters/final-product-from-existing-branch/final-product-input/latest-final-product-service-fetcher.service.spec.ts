import {
  CommitDetails,
  Development,
  ScmManagementService,
  ScmService,
} from "@mxflow/features/scm";
import {
  FinalProduct,
  FinalProducts,
  FinalProductService,
} from "@mxflow/features/artifact-manager";
import {
  LatestFinalProductFailureReason,
  LatestFinalProductServiceFetcher,
} from "./latest-final-product-service-fetcher.service";
import { of, throwError } from "rxjs";
import { FetchFinalProductRequest } from "./fetch-final-product-request";
import { Developments } from "../../../../../../../scm/src/lib/development/developments";
import { TestBed } from "@angular/core/testing";

function getRequest(): FetchFinalProductRequest {
  return {
    projectId: "projectId",
    repositoryId: "repositoryId",
    branchName: "branchName",
  };
}

describe("fetch latest final product test", () => {
  let scmService: ScmService;
  let scmManagementService: ScmManagementService;
  let finalProductService: FinalProductService;
  let service: LatestFinalProductServiceFetcher;

  beforeEach(() => {
    scmService = {
      getCommitDifferences: jest.fn(() => of(getExpectedCommitDifference())),
    } as unknown as ScmService;

    scmManagementService = {
      getDevelopments: jest.fn(() => of(getExpectedDevelopment())),
    } as unknown as ScmManagementService;

    finalProductService = {
      getFinalProducts: jest.fn(() =>
        of({
          content: [],
          totalPages: 0,
          totalElements: 0,
          size: 0,
          number: 0,
          last: false,
        })
      ),
    } as unknown as FinalProductService;

    TestBed.configureTestingModule({
      providers: [
        LatestFinalProductServiceFetcher,
        {
          provide: ScmService,
          useValue: scmService,
        },
        {
          provide: ScmManagementService,
          useValue: scmManagementService,
        },
        {
          provide: FinalProductService,
          useValue: finalProductService,
        },
      ],
    });

    service = TestBed.inject(LatestFinalProductServiceFetcher);
  });

  it("should delegate to service to fetch development with correct params", async () => {
    await service.getLatestFinalProductOnBranch(getRequest());

    expect(scmManagementService.getDevelopments).toHaveBeenCalledWith(
      "projectId",
      {
        name: "branchName",
        repositoryId: "repositoryId",
      }
    );
  });

  it("should delegate to service to fetch commit differences with correct params", async () => {
    await service.getLatestFinalProductOnBranch(getRequest());

    expect(scmService.getCommitDifferences).toHaveBeenCalledWith({
      projectId: "projectId",
      repositoryId: "repositoryId",
      sourceBranch: "branchName",
      destinationBranch: "parentBranchName",
    });
  });

  it("should fetch final product for each commit difference retrieved", async () => {
    await service.getLatestFinalProductOnBranch(getRequest());

    expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
      {
        branchFilter: "branchName",
        configurationCommitIdFilter: "commitId1",
        sort: "createdOn,desc",
      },
      "projectId"
    );

    expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
      {
        branchFilter: "branchName",
        configurationCommitIdFilter: "commitId2",
        sort: "createdOn,desc",
      },
      "projectId"
    );
  });

  it("should not proceed to fetch final products for other commits if it was found for a previous commit", async () => {
    finalProductService.getFinalProducts = jest.fn(() =>
      of(getExpectedFinalProduct())
    );

    await service.getLatestFinalProductOnBranch(getRequest());

    expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
      {
        branchFilter: "branchName",
        configurationCommitIdFilter: "commitId1",
        sort: "createdOn,desc",
      },
      "projectId"
    );

    expect(finalProductService.getFinalProducts).not.toHaveBeenCalledWith(
      {
        branchFilter: "branchName",
        configurationCommitIdFilter: "commitId2",
        sort: "createdOn,desc",
      },
      "projectId"
    );
  });

  it("given no final product was found on the commit difference, should fetch final product from fork point without a branch name because parent branch is unknown, and sort by createdOn to get the latest if multiple are found", async () => {
    await service.getLatestFinalProductOnBranch(getRequest());

    expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
      {
        configurationCommitIdFilter: "forkPointCommitId",
        sort: "createdOn,desc",
      },
      "projectId"
    );
  });

  it("should not delegate to service to final product from fork point if a final product was retrieved on a commit", async () => {
    finalProductService.getFinalProducts = jest.fn(() =>
      of(getExpectedFinalProduct())
    );

    await service.getLatestFinalProductOnBranch(getRequest());

    expect(finalProductService.getFinalProducts).not.toHaveBeenCalledWith(
      {
        branchFilter: "branchName",
        configurationCommitIdFilter: "forkPointCommitId",
      },
      "projectId"
    );
  });

  it("should return undefined if no final product is found", async () => {
    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.objectContaining({
        optionalFinalProduct: undefined,
      })
    );
  });

  it("should return that no final product is found when no final product is found", async () => {
    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.objectContaining({
        failureReason: LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND,
      })
    );
  });

  it("should return correct final product when found on a commit", async () => {
    finalProductService.getFinalProducts = jest.fn(() =>
      of(getExpectedFinalProduct())
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual({
      optionalFinalProduct: getFinalProduct(),
    });
  });

  it("should not return a failure reason when final product is found", async () => {
    finalProductService.getFinalProducts = jest.fn(() =>
      of(getExpectedFinalProduct())
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.not.objectContaining({
        failureReason: expect.any(LatestFinalProductFailureReason),
      })
    );
  });

  it("should return an empty optional final product when development is not found", async () => {
    scmManagementService.getDevelopments = jest.fn(() =>
      of([] as unknown as Developments)
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.not.objectContaining({
        optionalFinalProduct: expect.any(LatestFinalProductFailureReason),
      })
    );
  });

  it("should return a failure reason indicating that the branch name is not valid when development is not found", async () => {
    scmManagementService.getDevelopments = jest.fn(() =>
      of({ content: [] } as unknown as Developments)
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.objectContaining({
        failureReason: LatestFinalProductFailureReason.INVALID_BRANCH_NAME,
      })
    );
  });

  it("should return a failure reason indicating that the branch name is not valid when development has no source", async () => {
    scmManagementService.getDevelopments = jest.fn(() =>
      of({
        content: [getDevelopmentWithoutSource()],
      } as unknown as Developments)
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.objectContaining({
        failureReason: LatestFinalProductFailureReason.INVALID_BRANCH_NAME,
      })
    );
  });

  it("should return an empty optional final product when fetching development fails", async () => {
    scmManagementService.getDevelopments = jest.fn(() =>
      throwError(() => new Error())
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.not.objectContaining({
        optionalFinalProduct: expect.any(LatestFinalProductFailureReason),
      })
    );
  });

  it("should return a failure reason indicating that an expected error occurred when fetching development fails", async () => {
    scmManagementService.getDevelopments = jest.fn(() =>
      throwError(() => new Error())
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.objectContaining({
        failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
      })
    );
  });

  it("should return an empty optional final product when fetching commit differences fails", async () => {
    scmService.getCommitDifferences = jest.fn(() =>
      throwError(() => new Error())
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.not.objectContaining({
        optionalFinalProduct: expect.any(LatestFinalProductFailureReason),
      })
    );
  });

  it("should return a failure reason indicating that an expected error occurred when fetching commit difference fails", async () => {
    scmService.getCommitDifferences = jest.fn(() =>
      throwError(() => new Error())
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.objectContaining({
        failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
      })
    );
  });

  it("should return an empty optional final product when fetching final product on a commit fails", async () => {
    finalProductService.getFinalProducts = jest.fn(() =>
      throwError(() => new Error())
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.not.objectContaining({
        optionalFinalProduct: expect.any(LatestFinalProductFailureReason),
      })
    );
  });

  it("should return a failure reason indicating that an expected error occurred when fetching final product on a commit fails", async () => {
    finalProductService.getFinalProducts = jest.fn(() =>
      throwError(() => new Error())
    );

    const finalProduct = await service.getLatestFinalProductOnBranch(
      getRequest()
    );

    expect(finalProduct).toEqual(
      expect.objectContaining({
        failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
      })
    );
  });

  function getExpectedFinalProduct(): FinalProducts {
    return {
      content: [getFinalProduct()],
      totalPages: 1,
      totalElements: 2,
      size: 2,
      number: 2,
      last: false,
    };
  }

  function getFinalProduct(): FinalProduct {
    return {
      id: "finalProductId",
      projectId: "projectId",
      branch: "branch",
      repositoryId: "repositoryId",
      tag: "tag",
      validationLevel: "validationLevel",
      version: "version",
      environmentDefinitionId: "environmentDefinitionId",
      configurationCommitId: "configurationCommitId",
      state: "available",
      createdOn: "createdOn",
      rtpProduct: {
        id: "id",
        tag: "tag",
        rtpCommitId: "rtpCommitId",
      },
      factoryProduct: {
        id: "id",
        type: "type",
        softwareProduct: {
          id: "id",
          version: "version",
          revision: "revision",
        },
      },
      clientConfigurations: [
        {
          id: "id",
          type: "type",
          branch: "branch",
          commitId: "commitId",
        },
      ],
      mxBundles: [
        {
          id: "id",
          type: "type",
        },
      ],
      isTools: [
        {
          id: "id",
          type: "type",
          name: "name",
        },
      ],
      syncRequests: [],
    };
  }

  function getExpectedCommitDifference(): CommitDetails[] {
    return [
      {
        id: "commitId1",
        committerDisplayName: "string",
        committerDisplayEmail: "string",
        timeStamp: "string",
        message: "string",
        url: "string",
      },
      {
        id: "commitId2",
        committerDisplayName: "string",
        committerDisplayEmail: "string",
        timeStamp: "string",
        message: "string",
        url: "string",
      },
    ];
  }

  function getExpectedDevelopment(): Developments {
    return {
      totalPages: 3,
      totalElements: 15,
      size: 5,
      content: [getDevelopment()],
      empty: false,
      last: false,
    };
  }

  function getDevelopment(): Development {
    return {
      id: "id",
      name: "branchName",
      source: "parentBranchName",
      projectId: "projectId",
      repository: {
        id: "repositoryId",
        url: "repositoryUrl",
      },
      latestCommitId: "latestCommitId",
      createdOn: "createdOn",
      parentCommitId: "forkPointCommitId",
      deleted: false,
    };
  }

  function getDevelopmentWithoutSource(): Development {
    return {
      id: "id",
      name: "branchName",
      projectId: "projectId",
      repository: {
        id: "repositoryId",
        url: "repositoryUrl",
      },
      latestCommitId: "latestCommitId",
      createdOn: "createdOn",
      parentCommitId: "forkPointCommitId",
      deleted: false,
    };
  }
});
