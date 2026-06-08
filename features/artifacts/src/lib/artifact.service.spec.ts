import { HttpClient } from "@angular/common/http";
import { lastValueFrom, of } from "rxjs";
import { ArtifactService } from "./artifact.service";
import { AppConfig } from "@mxflow/config";

const projectId = "projectId";
describe("Package Service", () => {
  let service: ArtifactService;
  let httpClient: HttpClient;
  let appConfig: AppConfig = {
    gatewayUrl: "gatewayUrl/",
  } as unknown as AppConfig;

  it("should return all package names", async () => {
    httpClient = {
      get: jest.fn(() => {
        return of([
          {
            id: "mxconfig",
            name: "MxConfig",
          },
          {
            id: "mxconfig",
            name: "MxConfig",
          },
        ]);
      }),
    } as unknown as HttpClient;
    service = new ArtifactService(appConfig, httpClient);
    await expect(lastValueFrom(service.getArtifactNames())).resolves.toEqual([
      {
        id: "mxconfig",
        name: "MxConfig",
      },
      {
        id: "mxconfig",
        name: "MxConfig",
      },
    ]);
    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl + "bundles"
    );
  });

  it("should return all package values", async () => {
    httpClient = {
      get: jest.fn(() => {
        return of([
          {
            id: "mxconfig",
            projectId: projectId,
            artifactManagerId: "artifactManagerId1",
            version: "version1",
          },
          {
            id: "mxconfig",
            projectId: projectId,
            artifactManagerId: "artifactManagerId2",
            version: "version2",
          },
        ]);
      }),
    } as unknown as HttpClient;
    service = new ArtifactService(appConfig, httpClient);
    await expect(
      lastValueFrom(service.getArtifactValues(projectId))
    ).resolves.toEqual([
      {
        id: "mxconfig",
        projectId: projectId,
        artifactManagerId: "artifactManagerId1",
        version: "version1",
      },
      {
        id: "mxconfig",
        projectId: projectId,
        artifactManagerId: "artifactManagerId2",
        version: "version2",
      },
    ]);

    expect(httpClient.get).toHaveBeenCalledWith(
      appConfig.gatewayUrl + "projects/projectId/artifacts"
    );
  });

  it("should merge the the package names with the package values to et an array of complete packages", async () => {
    httpClient = {
      get: jest.fn((url) => {
        if (url === appConfig.gatewayUrl + "bundles") {
          return of([
            {
              id: "mxconfig",
              name: "Mx Config",
            },
            {
              id: "mxdeploy",
              name: "Mx Deploy",
            },
          ]);
        }
        return of([
          {
            id: "mxdeploy",
            projectId: projectId,
            artifactManagerId: "artifactManagerId2",
            version: "version2",
          },
          {
            id: "mxconfig",
            projectId: projectId,
            artifactManagerId: "artifactManagerId1",
            version: "version1",
          },
        ]);
      }),
    } as unknown as HttpClient;
    service = new ArtifactService(appConfig, httpClient);

    await expect(
      lastValueFrom(service.getArtifacts(projectId))
    ).resolves.toEqual([
      {
        id: "mxconfig",
        name: "Mx Config",
        projectId: projectId,
        artifactManagerId: "artifactManagerId1",
        version: "version1",
      },
      {
        id: "mxdeploy",
        name: "Mx Deploy",
        projectId: projectId,
        artifactManagerId: "artifactManagerId2",
        version: "version2",
      },
    ]);
  });

  it("should save the package", async () => {
    httpClient = {
      post: jest.fn(() => of({})),
    } as unknown as HttpClient;
    service = new ArtifactService(appConfig, httpClient);
    await lastValueFrom(
      service.saveArtifactValues(projectId, {
        id: "mxconfig",
        artifactManagerId: "artifactManager1",
        version: "version1",
      })
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      appConfig.gatewayUrl + "projects/projectId/artifacts",
      {
        artifactManagerId: "artifactManager1",
        id: "mxconfig",
        version: "version1",
      }
    );
  });
});
