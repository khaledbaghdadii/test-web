import { ScmManagementService } from "./scm-management.service";
import { of } from "rxjs";
import { Development } from "@mxflow/features/scm";
import { DevelopmentApiModel } from "./development/development-api-model";
import { DevelopmentsApiModel } from "./development/developments-api-model";
import { Developments } from "./development/developments";

describe("Service: ScmManagement", () => {
  let service: ScmManagementService;

  const PROJECT_ID = "projectId";
  const GATEWAY_URL = "gatewayUrl/";
  const DEVELOPMENT_ID = "developmentId";

  let appConfig: any = {
    gatewayUrl: GATEWAY_URL,
  };
  let httpClient: any = {
    get: jest.fn(() => of({})),
  };

  beforeEach(() => {
    service = new ScmManagementService(appConfig, httpClient);
  });

  describe("Get Development", () => {
    it("should get the data correctly", function (done) {
      let httpClientSpy = jest.spyOn(httpClient, "get");
      httpClientSpy.mockReturnValue(of(getDevelopmentApiModel()));

      service.getDevelopment(PROJECT_ID, "developmentId").subscribe({
        next: (data) => {
          expect(httpClientSpy).toHaveBeenCalledWith(
            `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/developments/${DEVELOPMENT_ID}`
          );
          expect(data).toEqual(getDevelopment());
          done();
        },
      });
    });

    it("should include includeDeleted param when provided", (done) => {
      const httpClientSpy = jest.spyOn(httpClient, "get");
      httpClientSpy.mockReturnValue(of(getDevelopmentApiModel()));

      service.getDevelopment(PROJECT_ID, DEVELOPMENT_ID, true).subscribe({
        next: (data) => {
          expect(httpClientSpy).toHaveBeenCalledWith(
            `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/developments/${DEVELOPMENT_ID}?includeDeleted=true`
          );
          expect(data).toEqual(getDevelopment());
          done();
        },
      });
    });
  });

  describe("Get Developments", () => {
    const BASE_URL = `${GATEWAY_URL}scm-management/projects/${PROJECT_ID}/developments`;
    let httpClientSpy: jest.SpyInstance;

    beforeEach(() => {
      httpClientSpy = jest
        .spyOn(httpClient, "get")
        .mockReturnValue(of(getDevelopmentsApiModel()));
    });

    it("should get data correctly with all filters provided", (done) => {
      const filters = {
        repositoryId: "repo123",
        name: "feature-branch",
        fetchParent: true,
      };
      const expectedUrl = `${BASE_URL}?repositoryId=repo123&name=feature-branch`;

      service.getDevelopments(PROJECT_ID, filters).subscribe({
        next: (data) => {
          expect(httpClientSpy).toHaveBeenCalledWith(expectedUrl);
          expect(data).toEqual(getExpectedDevelopment());
          done();
        },
      });
    });

    it("should omit the repositoryId filter if undefined", (done) => {
      const filters = { repositoryId: undefined, name: "feature-branch" };
      const expectedUrl = `${BASE_URL}?name=feature-branch`;

      service.getDevelopments(PROJECT_ID, filters).subscribe({
        next: (data) => {
          expect(httpClientSpy).toHaveBeenCalledWith(expectedUrl);
          expect(data).toEqual(getExpectedDevelopment());
          done();
        },
      });
    });

    it("should omit the name filter if it is an empty string", (done) => {
      const filters = { repositoryId: "repo123", name: "" };
      const expectedUrl = `${BASE_URL}?repositoryId=repo123`;

      service.getDevelopments(PROJECT_ID, filters).subscribe({
        next: (data) => {
          expect(httpClientSpy).toHaveBeenCalledWith(expectedUrl);
          expect(data).toEqual(getExpectedDevelopment());
          done();
        },
      });
    });

    it("should omit both repositoryId and name if they are undefined or empty", (done) => {
      const filters = { repositoryId: undefined, name: "" };
      const expectedUrl = BASE_URL;

      let httpClientSpy = jest.spyOn(httpClient, "get");
      httpClientSpy.mockReturnValue(of(getDevelopmentsApiModel()));

      service.getDevelopments(PROJECT_ID, filters).subscribe({
        next: (data) => {
          expect(httpClientSpy).toHaveBeenCalledWith(expectedUrl);
          expect(data).toEqual(getExpectedDevelopment());
          done();
        },
      });
    });
  });
});

function getExpectedDevelopment(): Developments {
  return {
    totalPages: 3,
    totalElements: 15,
    size: 5,
    content: [getDevelopmentApiModel()],
    empty: false,
    last: false,
  };
}

function getDevelopment(): Development {
  return {
    id: "id",
    name: "name",
    source: "parentBranchName",
    projectId: "projectId",
    repository: {
      id: "repositoryId",
      url: "repositoryUrl",
    },
    latestCommitId: "latestCommitId",
    createdOn: "createdOn",
    parentCommitId: "parentCommitId",
    deleted: false,
  };
}

function getDevelopmentsApiModel(): DevelopmentsApiModel {
  return {
    totalPages: 3,
    totalElements: 15,
    size: 5,
    content: [getDevelopmentApiModel()],
    empty: false,
    last: false,
  };
}

function getDevelopmentApiModel(): DevelopmentApiModel {
  return {
    id: "id",
    name: "name",
    source: "parentBranchName",
    projectId: "projectId",
    repository: {
      id: "repositoryId",
      url: "repositoryUrl",
    },
    latestCommitId: "latestCommitId",
    createdOn: "createdOn",
    parentCommitId: "parentCommitId",
    deleted: false,
  };
}
