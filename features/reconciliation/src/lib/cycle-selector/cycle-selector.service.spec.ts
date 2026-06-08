import { CycleSelectorService } from "./cycle-selector.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient } from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { Cycle } from "./cycle-selector.component";

describe("CycleSelectorService", () => {
  const GATEWAY_URL = "GATEWAY_URL/";
  const PROJECT_ID = "test-project-id";

  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;

  const CYCLE_1: Cycle = {
    id: "cycle-1",
    name: "Cycle 1",
    description: "First cycle",
    sourceVersion: "1.0",
    targetVersion: "2.0",
    createdAt: "2024-01-01",
    status: "ONGOING",
    creatorEmail: "user1@test.com",
  };

  const CYCLE_2: Cycle = {
    id: "cycle-2",
    name: "Cycle 2",
    description: "Second cycle",
    sourceVersion: "2.0",
    targetVersion: "3.0",
    createdAt: "2024-02-01",
    status: "ARCHIVED",
    creatorEmail: "user2@test.com",
  };

  const CYCLES: Cycle[] = [CYCLE_1, CYCLE_2];

  let service: CycleSelectorService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => of([])),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [CycleSelectorService],
    })
      .overrideProvider(HttpClient, { useValue: httpClient })
      .overrideProvider(APP_CONFIG, { useValue: appConfig });

    service = TestBed.inject(CycleSelectorService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("getCycles", () => {
    beforeEach(() => {
      jest.spyOn(httpClient, "get").mockReturnValue(of(CYCLES));
    });

    it("should fetch cycles for a given projectId", async () => {
      await expect(
        lastValueFrom(service.getCycles(PROJECT_ID))
      ).resolves.toEqual(CYCLES);
      expect(httpClient.get).toHaveBeenCalledTimes(1);
    });

    it("should call the correct URL", async () => {
      await lastValueFrom(service.getCycles(PROJECT_ID));

      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}reconciliation/projects/${PROJECT_ID}/cycles/`
      );
    });

    it("should return an empty array when no cycles exist", async () => {
      jest.spyOn(httpClient, "get").mockReturnValue(of([]));

      await expect(
        lastValueFrom(service.getCycles(PROJECT_ID))
      ).resolves.toEqual([]);
    });

    it("should propagate errors on failure", async () => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => new Error("Server error")));

      await expect(
        lastValueFrom(service.getCycles(PROJECT_ID))
      ).rejects.toThrow("Server error");
    });
  });
});
