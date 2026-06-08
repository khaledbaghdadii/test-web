import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { APP_CONFIG } from "@mxflow/config";
import { VersionService } from "./version.service";
import { VersionApiModel, VersionType } from "./version-api-model";
import { Page } from "../page";
import { FetchVersionsQuery } from "./fetch-versions-query";

const GATEWAY_URL = "gatewayUrl";
const VERSIONS_URL = `${GATEWAY_URL}validation-resources/versions`;

describe("VersionService", () => {
  let service: VersionService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VersionService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(VersionService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch versions with all params passed", async () => {
    const queryWithAllParams: FetchVersionsQuery = {
      page: 1,
      size: 20,
      versionTypes: [VersionType.ARCHIVAL, VersionType.RELEASE_FORECAST],
      active: true,
      namePhrase: "archival",
    };
    const resultPromise = firstValueFrom(
      service.fetchVersions(queryWithAllParams)
    );

    const req = httpController.expectOne((r) => r.url === VERSIONS_URL);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("page")).toBe("1");
    expect(req.request.params.get("size")).toBe("20");
    expect(req.request.params.getAll("versionTypes")).toEqual([
      VersionType.ARCHIVAL,
      VersionType.RELEASE_FORECAST,
    ]);
    expect(req.request.params.get("active")).toBe("true");
    expect(req.request.params.get("namePhrase")).toBe("archival");
    req.flush(getPagedVersionsResponse());

    expect(await resultPromise).toEqual(getPagedVersionsResponse());
  });

  it("should fetch versions given no optional params are passed", async () => {
    const resultPromise = firstValueFrom(
      service.fetchVersions({ page: 0, size: 10 })
    );

    const req = httpController.expectOne((r) => r.url === VERSIONS_URL);
    expect(req.request.params.get("page")).toBe("0");
    expect(req.request.params.get("size")).toBe("10");
    expect(req.request.params.has("versionTypes")).toBe(false);
    expect(req.request.params.has("active")).toBe(false);
    expect(req.request.params.has("namePhrase")).toBe(false);
    req.flush(getPagedVersionsResponse());

    await resultPromise;
  });

  it("should include no values for versionTypes param when array is empty", async () => {
    const resultPromise = firstValueFrom(
      service.fetchVersions({ page: 0, size: 10, versionTypes: [] })
    );

    const req = httpController.expectOne((r) => r.url === VERSIONS_URL);
    expect(req.request.params.getAll("versionTypes")).toEqual([]);
    req.flush(getPagedVersionsResponse());

    await resultPromise;
  });

  it("should include active param when false", async () => {
    const resultPromise = firstValueFrom(
      service.fetchVersions({ page: 0, size: 10, active: false })
    );

    const req = httpController.expectOne((r) => r.url === VERSIONS_URL);
    expect(req.request.params.get("active")).toBe("false");
    req.flush(getPagedVersionsResponse());

    await resultPromise;
  });

  it("should throw error if failed to fetch versions", async () => {
    const resultPromise = firstValueFrom(
      service.fetchVersions({ page: 0, size: 10 })
    );

    httpController
      .expectOne((r) => r.url === VERSIONS_URL)
      .flush("Internal server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

    await expect(resultPromise).rejects.toMatchObject({
      status: 500,
      statusText: "Internal Server Error",
    });
  });

  function getPagedVersionsResponse(): Page<VersionApiModel> {
    return {
      content: [
        {
          id: "v1",
          name: "version-1",
          active: true,
          type: VersionType.ARCHIVAL,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      last: true,
    };
  }
});
