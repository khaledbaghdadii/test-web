import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { APP_CONFIG } from "@mxflow/config";
import { ClientImpactNoteService } from "./client-impact-note.service";
import { ClientImpactNoteAffectedVersionsConfigApiModel } from "./client-impact-note-affected-versions-config-api-model";
import { VersionType } from "../version/version-api-model";
import { ClientImpactNoteFieldType } from "./client-impact-note-field-type.enum";

const GATEWAY_URL = "gatewayUrl";
const ALLOWED_VERSIONS_CONFIG_URL = `${GATEWAY_URL}failure-management/client-impact-note/affected-versions/allowed-versions-configuration`;
const FIELDS_URL = `${GATEWAY_URL}failure-management/client-impact-note/fields`;

describe("ClientImpactNoteService", () => {
  let service: ClientImpactNoteService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ClientImpactNoteService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ClientImpactNoteService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should fetch fields by type", async () => {
    const response = [
      { id: "1", name: "opt1" },
      { id: "2", name: "opt2" },
    ];
    const resultPromise = firstValueFrom(
      service.fetch(ClientImpactNoteFieldType.RESOLUTION_TYPE)
    );

    const req = httpController.expectOne((r) => r.url === FIELDS_URL);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("type")).toBe(
      ClientImpactNoteFieldType.RESOLUTION_TYPE
    );
    req.flush(response);

    expect(await resultPromise).toEqual(response);
  });

  it("should fail to fetch fields when server errors", async () => {
    const resultPromise = firstValueFrom(
      service.fetch(ClientImpactNoteFieldType.STREAM)
    );

    httpController
      .expectOne((r) => r.url === FIELDS_URL)
      .flush("failed", { status: 500, statusText: "Internal Server Error" });

    await expect(resultPromise).rejects.toHaveProperty("message", "failed");
  });

  it("should fetch allowed versions configuration", async () => {
    const resultPromise = firstValueFrom(
      service.fetchAllowedVersionsConfiguration()
    );

    const req = httpController.expectOne(
      (r) => r.url === ALLOWED_VERSIONS_CONFIG_URL
    );
    expect(req.request.method).toBe("GET");
    req.flush(getAllowedVersionsConfigResponse());

    expect(await resultPromise).toEqual(getAllowedVersionsConfigResponse());
  });

  it("should throw error if failed to fetch allowed versions configuration", async () => {
    const resultPromise = firstValueFrom(
      service.fetchAllowedVersionsConfiguration()
    );

    httpController
      .expectOne((r) => r.url === ALLOWED_VERSIONS_CONFIG_URL)
      .flush("Internal server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

    await expect(resultPromise).rejects.toMatchObject({
      status: 500,
      statusText: "Internal Server Error",
    });
  });

  function getAllowedVersionsConfigResponse(): ClientImpactNoteAffectedVersionsConfigApiModel {
    return {
      allowedVersionTypes: [
        VersionType.ARCHIVAL,
        VersionType.RELEASE_EFFECTIVE,
      ],
      allowedInactive: true,
    };
  }
});
