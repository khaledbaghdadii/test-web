import { PatternDetailsService } from "./pattern-details.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { lastValueFrom, of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { PatternDetails } from "./pattern-details.model";
describe("PatternDetailsService", () => {
  const GATEWAY_URL = "GATEWAY_URL/";
  const PATTERN_INSTANCE_ID = "pattern-instance-id";
  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;
  const PATTERN_DETAILS: PatternDetails = {
    id: 1,
    title: "Pattern 1",
    description: "A pattern",
    createdInPackage: "Package A",
    createdInCycleId: "cycle-1",
    originalScript: "{{Type}}",
    linkedRootCauses: [],
    impactedGroups: ["tradeDate"],
    differenceTypes: ["MISMATCH"],
    ownerUserName: "owner@test.com",
    referencedColumns: [],
    deletable: true,
    editable: true,
    editedVersion: false,
    patternType: "SPECIFIC",
    versionNumber: 1,
    approved: false,
    patternInstanceId: PATTERN_INSTANCE_ID,
    unapplied: false,
  };
  let service: PatternDetailsService;
  let httpClient: HttpClient;
  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => of(PATTERN_DETAILS)),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [PatternDetailsService],
    })
      .overrideProvider(HttpClient, { useValue: httpClient })
      .overrideProvider(APP_CONFIG, { useValue: appConfig });
    service = TestBed.inject(PatternDetailsService);
  });
  it("should be created", () => {
    expect(service).toBeTruthy();
  });
  describe("getPatternDetailsByPatternInstanceId", () => {
    beforeEach(() => {
      jest.spyOn(httpClient, "get").mockReturnValue(of(PATTERN_DETAILS));
    });
    it("should fetch pattern details for a given projectId and patternInstanceId", async () => {
      await expect(
        lastValueFrom(
          service.getPatternDetailsByPatternInstanceId(PATTERN_INSTANCE_ID)
        )
      ).resolves.toEqual(PATTERN_DETAILS);
      expect(httpClient.get).toHaveBeenCalledTimes(1);
    });
    it("should call the correct URL", async () => {
      const params = new HttpParams();
      await lastValueFrom(
        service.getPatternDetailsByPatternInstanceId(PATTERN_INSTANCE_ID)
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}reconciliation/patterns/pattern-instances/${PATTERN_INSTANCE_ID}/details`,
        { params }
      );
    });
    it("should propagate errors on failure", async () => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(throwError(() => new Error("Server error")));
      await expect(
        lastValueFrom(
          service.getPatternDetailsByPatternInstanceId(PATTERN_INSTANCE_ID)
        )
      ).rejects.toThrow("Server error");
    });
  });
});
