import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { EnvironmentService } from "./environment.service";
import { firstValueFrom } from "rxjs";
import {
  EnvironmentPageApiModel,
  EnvironmentApiModel,
} from "./environment-api-model";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { EnvironmentDefinitionStatus } from "../environment-definition/environment-definition";

const GATEWAY_URL = "https://api.test.com/";

describe("EnvironmentService", () => {
  let service: EnvironmentService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EnvironmentService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(EnvironmentService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should return empty array when no environment ids are provided", async () => {
    const result = await firstValueFrom(service.fetchByEnvironmentIds([]));

    expect(result).toEqual([]);
  });

  it("should fetch environments by ids and map them", async () => {
    const apiResponse: EnvironmentPageApiModel = {
      content: [
        {
          id: "env-001",
          status: "READY",
          projectId: "proj-001",
          createdOn: "2026-03-01T10:00:00Z",
          bundles: [{ id: "CORE", branch: "9.24", version: "9.24.1.12345" }],
          isTools: [{ name: "mxtestweb" }],
          configurationIdentifier: {
            branch: "main",
            revision: "abc123",
          },
          databases: [
            {
              name: "db-001",
              allocation: {
                name: "dbserver",
                port: "3306",
                machine: { name: "host1" },
              },
              mxDbTypes: ["financial"],
            },
          ],
        },
      ],
      totalElements: 1,
    };

    const resultPromise = firstValueFrom(
      service.fetchByEnvironmentIds(["env-001"])
    );

    const request = httpController.expectOne(
      (req) =>
        req.url === `${GATEWAY_URL}environments` &&
        req.params.get("environmentId") === "env-001" &&
        req.params.get("size") === "1" &&
        req.params.get("page") === "0" &&
        req.params.get("sort") === "createdOn,asc"
    );
    request.flush(apiResponse);

    expect(await resultPromise).toEqual([
      {
        id: "env-001",
        status: "READY",
        projectId: "proj-001",
        startDate: "2026-03-01T10:00:00Z",
        mxVersion: "9.24",
        mxBuildId: "9.24.1.12345",
        commitId: "abc123",
        bundles: [{ id: "CORE", branch: "9.24", version: "9.24.1.12345" }],
        isTools: [{ name: "mxtestweb" }],
        outputsDirectoryUri: undefined,
        databases: [{ name: "db-001", mxDbTypes: ["financial"] }],
      },
    ]);
  });

  it("should join multiple environment ids with comma", async () => {
    const resultPromise = firstValueFrom(
      service.fetchByEnvironmentIds(["env-001", "env-002", "env-003"])
    );

    const request = httpController.expectOne(
      (req) =>
        req.url === `${GATEWAY_URL}environments` &&
        req.params.get("environmentId") === "env-001,env-002,env-003" &&
        req.params.get("size") === "3"
    );
    request.flush({ content: [], totalElements: 0 });

    expect(await resultPromise).toEqual([]);
  });

  it("should propagate errors", async () => {
    const resultPromise = firstValueFrom(
      service.fetchByEnvironmentIds(["env-001"])
    ).catch((error) => error);

    httpController
      .expectOne(
        `${GATEWAY_URL}environments?environmentId=env-001&size=1&page=0&sort=createdOn,asc`
      )
      .error(new ProgressEvent("error"), { statusText: "Server Error" });

    const error = await resultPromise;
    expect(error).toBeInstanceOf(Error);
  });

  it("should fetch environment by project and environment id and map it", async () => {
    const apiResponse: EnvironmentApiModel = {
      id: "env-001",
      projectId: "proj-001",
      status: "READY",
      createdOn: "2026-03-01T10:00:00Z",
      outputsDirectoryUri: "https://storage.example.com/outputs/env-001",
      isTools: [{ name: "mxtestweb" }],
      databases: [
        {
          name: "db-fin",
          allocation: {
            name: "dbserver",
            port: "3306",
            machine: { name: "host1" },
          },
          mxDbTypes: ["financial", "reporting"],
        },
      ],
    };

    const resultPromise = firstValueFrom(
      service.fetchByProjectAndEnvironmentId("proj-001", "env-001")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001`
    );
    request.flush(apiResponse);

    const result = await resultPromise;

    expect(result.id).toBe("env-001");
    expect(result.status).toBe(EnvironmentStatus.READY);
    expect(result.outputsDirectoryUri).toBe(
      "https://storage.example.com/outputs/env-001"
    );
    expect(result.isTools).toEqual([{ name: "mxtestweb" }]);
    expect(result.databases).toEqual([
      { name: "db-fin", mxDbTypes: ["financial", "reporting"] },
    ]);
  });

  it("should propagate errors from fetchByProjectAndEnvironmentId", async () => {
    const resultPromise = firstValueFrom(
      service.fetchByProjectAndEnvironmentId("proj-001", "env-001")
    ).catch((error) => error);

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001`
    );
    request.flush("Server error", {
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await resultPromise;

    expect(result).toBeInstanceOf(Error);
  });

  it("should fetch active environment definitions by default", async () => {
    const resultPromise = firstValueFrom(
      service.getEnvironmentDefinitions("proj-001")
    );

    const request = httpController.expectOne(
      (req) =>
        req.url ===
          `${GATEWAY_URL}projects/proj-001/environments/definitions` &&
        req.params.get("includeInactive") === "false"
    );
    expect(request.request.method).toBe("GET");
    request.flush([
      {
        id: "env-def-001",
        name: "Small",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
    ]);

    await expect(resultPromise).resolves.toEqual([
      {
        id: "env-def-001",
        name: "Small",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
    ]);
  });

  it("should include inactive environment definitions when requested", async () => {
    service.getEnvironmentDefinitions("proj-001", true).subscribe();

    const request = httpController.expectOne(
      (req) =>
        req.url ===
          `${GATEWAY_URL}projects/proj-001/environments/definitions` &&
        req.params.get("includeInactive") === "true"
    );

    expect(request.request.method).toBe("GET");
    request.flush([]);
  });

  it("should fetch environment definition by id", async () => {
    const resultPromise = firstValueFrom(
      service.getEnvironmentDefinitionById("proj-001", "env-def-001")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/definitions/env-def-001`
    );
    expect(request.request.method).toBe("GET");
    request.flush({
      id: "env-def-001",
      name: "Small",
      status: EnvironmentDefinitionStatus.ACTIVE,
    });

    await expect(resultPromise).resolves.toEqual({
      id: "env-def-001",
      name: "Small",
      status: EnvironmentDefinitionStatus.ACTIVE,
    });
  });
});
