/* tslint:disable:no-unused-variable */

import { HttpClient } from "@angular/common/http";
import { AppConfig } from "@mxflow/config";
import { RepositoryService } from "./repository.service";
import { lastValueFrom, of } from "rxjs";
import { UpdateRepositoryCredentialsRequest } from "./request/update-repository-credentials-request";

const NAME = "NAME";
const REPOSITORY_URL = "URL";
const USERNAME = "USERNAME";
const PASSWORD = "PASSWORD";
const LABEL = "LABEL";
const PROJECT_ID = "2b2ce6b4-cd66-45e3-bd26-f98e440ec159";
const EXISTING_REPO_ID = "4e29eced-c9da-407b-a2ef-405811f42c98";
const REPO_ID = "4e29eced-0000-0000-0000-405811f42c98";
const NEW_REPO_NAME = "NEW_REPO_NAME";
const NEW_REPO_URL = "NEW_REPO_URL";
const BRANCH = "BRANCH";

const TestData = [
  {
    id: "4e29eced-c9da-407b-a2ef-405811f42c98",
    name: "MXflow Environment Deployment",
    url: "ssh://git@stash.murex.com:7999/mxflow/mxflow-environment-deployment.git",
    credentialsId:
      "project/2b2ce6b4-cd66-45e3-bd26-f98e440ec159/repository/config/4e29eced-c9da-407b-a2ef-405811f42c98",
    label: "config",
  },
];

const getExpectedRepositoryList = [
  {
    id: "4e29eced-c9da-407b-a2ef-405811f42c98",
    name: "MXflow Environment Deployment",
    url: "ssh://git@stash.murex.com:7999/mxflow/mxflow-environment-deployment.git",
    credentialsId:
      "project/2b2ce6b4-cd66-45e3-bd26-f98e440ec159/repository/config/4e29eced-c9da-407b-a2ef-405811f42c98",
    label: "config",
  },
];

const getExpectedRepositoryCreateApiResponse = {
  id: REPO_ID,
  name: NAME,
  url: REPOSITORY_URL,
};

const getExpectedRepositoryUpdateApiResponse = {
  id: EXISTING_REPO_ID,
  name: NEW_REPO_NAME,
  url: NEW_REPO_URL,
};
const editRepoCredentialsRequest: UpdateRepositoryCredentialsRequest = {
  username: USERNAME,
  password: PASSWORD,
};

describe("Service: RepositoryService", () => {
  let service: RepositoryService;
  let httpClient: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: "https://gateway.cd.murex.com/api/v1/",
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClient = {
      get: jest.fn((url) => {
        if (
          url ===
          appConfig.gatewayUrl + `projects/${PROJECT_ID}/repositories`
        ) {
          return of(TestData);
        } else if (
          url ==
          appConfig.gatewayUrl +
            `projects/${PROJECT_ID}/repositories/${EXISTING_REPO_ID}`
        ) {
          return of(TestData[0]);
        }
        return of({});
      }),

      post: jest.fn((url, repoDetails) => {
        if (
          url ===
          appConfig.gatewayUrl + `projects/${PROJECT_ID}/repositories`
        ) {
          return of({
            id: REPO_ID,
            name: repoDetails.name,
            url: repoDetails.url,
          });
        }
        return {};
      }),

      put: jest.fn((url, repoDetails) => {
        if (
          url ===
          appConfig.gatewayUrl +
            `projects/${PROJECT_ID}/repositories/${EXISTING_REPO_ID}`
        ) {
          return of({
            id: EXISTING_REPO_ID,
            name: repoDetails.name,
            url: repoDetails.url,
          });
        } else if (
          url ===
          appConfig.gatewayUrl +
            `projects/${PROJECT_ID}/repositories/${EXISTING_REPO_ID}/credentials`
        ) {
          return of();
        }
        return {};
      }),

      delete: jest.fn((url) => {
        if (
          url ===
          appConfig.gatewayUrl +
            `projects/${PROJECT_ID}/repositories/${EXISTING_REPO_ID}`
        ) {
          return of();
        }
        return {};
      }),
    } as unknown as HttpClient;

    service = new RepositoryService(appConfig, httpClient);
  });

  it("should return all repositories for a given project", async () => {
    await expect(
      lastValueFrom(service.getAllRepositories(PROJECT_ID))
    ).resolves.toEqual(getExpectedRepositoryList);
  });

  it("should return a repository from id", async () => {
    await expect(
      lastValueFrom(service.getRepoById(PROJECT_ID, EXISTING_REPO_ID))
    ).resolves.toEqual(getExpectedRepositoryList[0]);
  });

  it("should return correct new added repository", async () => {
    const result = await lastValueFrom(
      service.createRepo(PROJECT_ID, {
        name: NAME,
        url: REPOSITORY_URL,
        username: USERNAME,
        pass: PASSWORD,
        label: LABEL,
        defaultBranch: BRANCH,
      })
    );

    expect(httpClient.post).toHaveBeenCalledWith(expect.any(String), {
      name: NAME,
      url: REPOSITORY_URL,
      username: USERNAME,
      pass: PASSWORD,
      label: LABEL,
      defaultBranch: BRANCH,
    });

    expect(result).toEqual(getExpectedRepositoryCreateApiResponse);
  });

  it("should return correct updated repository", async () => {
    const result = await lastValueFrom(
      service.editRepo(PROJECT_ID, EXISTING_REPO_ID, {
        name: NEW_REPO_NAME,
        url: NEW_REPO_URL,
        defaultBranch: BRANCH,
      })
    );

    expect(httpClient.put).toHaveBeenCalledWith(expect.any(String), {
      name: NEW_REPO_NAME,
      url: NEW_REPO_URL,
      defaultBranch: BRANCH,
    });
    expect(result).toEqual(getExpectedRepositoryUpdateApiResponse);
  });

  it("should call update credentials endpoint with correct data", async () => {
    service.editRepoCredentials(
      PROJECT_ID,
      EXISTING_REPO_ID,
      editRepoCredentialsRequest
    );
    expect(httpClient.put).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/repositories/${EXISTING_REPO_ID}/credentials`,
      editRepoCredentialsRequest
    );
  });
  it("should call delete endpoint with correct id", async () => {
    service.deleteRepo(PROJECT_ID, EXISTING_REPO_ID);
    expect(httpClient.delete).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/repositories/${EXISTING_REPO_ID}`
    );
  });
});
