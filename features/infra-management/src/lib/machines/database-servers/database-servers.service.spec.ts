import { AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { DatabaseServersService } from "@mxflow/features/infra-management";
import { of, throwError } from "rxjs";
import { DatabaseServerVersionsApiResponse } from "./model/response/database-server-versions-api-response";
import { DatabaseServerType } from "./model/database-server-type";

describe("Service: DatabaseServersService", () => {
  const GATEWAY_URL = "https://gateway.cd.murex.com/api/v1/";
  const PROJECT_ID = "projectId";
  const SERVER_TYPE = DatabaseServerType.ORACLE;
  const ERROR_MESSAGE = "ERROR_MESSAGE";
  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;
  let httpClient: HttpClient;
  let service: DatabaseServersService;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as HttpClient;
    service = new DatabaseServersService(appConfig, httpClient);
  });

  it("should get database server versions", async () => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(of(getDatabaseServerVersionsApiResponse()));

    service.getDatabaseServerVersions(PROJECT_ID, SERVER_TYPE).subscribe({
      next: (data) => {
        expect(data).toEqual(getDatabaseServerVersionsApiResponse());
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}projects/${PROJECT_ID}/infra/registry/db-servers/versions?databaseServerType=${SERVER_TYPE}`
    );
  });

  it("should throw an error on failure to get database server versions", (done) => {
    jest
      .spyOn(httpClient, "get")
      .mockReturnValue(throwError(() => new Error(ERROR_MESSAGE)));

    service.getDatabaseServerVersions(PROJECT_ID, SERVER_TYPE).subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        expect(error.message).toEqual(ERROR_MESSAGE);
        done();
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${GATEWAY_URL}projects/${PROJECT_ID}/infra/registry/db-servers/versions?databaseServerType=${SERVER_TYPE}`
    );
  });
});
function getDatabaseServerVersionsApiResponse(): DatabaseServerVersionsApiResponse {
  return {
    databaseServerVersions: [
      {
        version: "1.0",
        engineSpecificDetails: ["1.0.1", "1.0.2"],
      },
      {
        version: "2.0",
      },
    ],
  };
}
