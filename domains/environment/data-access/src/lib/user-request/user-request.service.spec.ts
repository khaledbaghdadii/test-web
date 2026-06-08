import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { UserRequestService } from "./user-request.service";
import { firstValueFrom } from "rxjs";

const GATEWAY_URL = "https://api.test.com/";

describe("DeploymentRequestService", () => {
  let service: UserRequestService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserRequestService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(UserRequestService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should return empty status when no request ids are provided", async () => {
    const result = await firstValueFrom(
      service.fetchUserRequestStatus("project-1", [])
    );

    expect(result).toEqual({
      environmentIds: [],
      latestRequestInProgress: false,
      latestRequestFailed: false,
    });
  });

  it("should fetch deployment requests and extract environment ids", async () => {
    const resultPromise = firstValueFrom(
      service.fetchUserRequestStatus("project-1", ["req-1", "req-2"])
    );

    const request = httpController.expectOne(
      (req) =>
        req.url ===
          `${GATEWAY_URL}projects/project-1/environments/user-requests` &&
        req.params.get("requestIds") === "req-1,req-2"
    );
    request.flush([
      {
        id: "req-1",
        environmentId: "env-1",
        completedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "req-2",
        environmentId: "env-2",
        completedAt: "2026-01-02T00:00:00Z",
      },
    ]);

    const result = await resultPromise;
    expect(result.environmentIds).toEqual(["env-1", "env-2"]);
    expect(result.latestRequestInProgress).toBe(false);
    expect(result.latestRequestFailed).toBe(false);
  });

  it("should detect latest request in progress when it has no environment id and no completed at", async () => {
    const resultPromise = firstValueFrom(
      service.fetchUserRequestStatus("project-1", ["req-1", "req-2"])
    );

    const request = httpController.expectOne(
      (req) =>
        req.url ===
        `${GATEWAY_URL}projects/project-1/environments/user-requests`
    );
    request.flush([
      {
        id: "req-1",
        environmentId: "env-1",
        completedAt: "2026-01-01T00:00:00Z",
      },
      { id: "req-2" },
    ]);

    const result = await resultPromise;
    expect(result.environmentIds).toEqual(["env-1"]);
    expect(result.latestRequestInProgress).toBe(true);
    expect(result.latestRequestFailed).toBe(false);
  });

  it("should detect latest request failed when it has no environment id but has completed at", async () => {
    const resultPromise = firstValueFrom(
      service.fetchUserRequestStatus("project-1", ["req-1", "req-2"])
    );

    const request = httpController.expectOne(
      (req) =>
        req.url ===
        `${GATEWAY_URL}projects/project-1/environments/user-requests`
    );
    request.flush([
      {
        id: "req-1",
        environmentId: "env-1",
        completedAt: "2026-01-01T00:00:00Z",
      },
      { id: "req-2", completedAt: "2026-01-02T00:00:00Z" },
    ]);

    const result = await resultPromise;
    expect(result.environmentIds).toEqual(["env-1"]);
    expect(result.latestRequestInProgress).toBe(false);
    expect(result.latestRequestFailed).toBe(true);
  });

  it("should filter out requests without environment ids", async () => {
    const resultPromise = firstValueFrom(
      service.fetchUserRequestStatus("project-1", ["req-1", "req-2", "req-3"])
    );

    const request = httpController.expectOne(
      (req) =>
        req.url ===
        `${GATEWAY_URL}projects/project-1/environments/user-requests`
    );
    request.flush([
      { id: "req-1", environmentId: "env-1" },
      { id: "req-2" },
      {
        id: "req-3",
        environmentId: "env-3",
        completedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    const result = await resultPromise;
    expect(result.environmentIds).toEqual(["env-1", "env-3"]);
  });

  it("should propagate http errors", async () => {
    const resultPromise = firstValueFrom(
      service.fetchUserRequestStatus("project-1", ["req-1"])
    );

    const request = httpController.expectOne(
      (req) =>
        req.url ===
        `${GATEWAY_URL}projects/project-1/environments/user-requests`
    );
    request.flush("Server error", {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(resultPromise).rejects.toThrow();
  });
});
