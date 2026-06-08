import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { DatabaseEditorService } from "./database-editor.service";
import { firstValueFrom } from "rxjs";

const GATEWAY_URL = "https://api.test.com/";

describe("DatabaseEditorService", () => {
  let service: DatabaseEditorService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DatabaseEditorService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(DatabaseEditorService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it("should return the editor url from the location header", async () => {
    const resultPromise = firstValueFrom(
      service.fetchEditorUrl("proj-001", "env-001", "db-financial")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001/databases/db-financial/editor`
    );
    request.flush(null, {
      headers: { Location: "https://db-editor.example.com/session/123" },
    });

    const result = await resultPromise;
    expect(result).toBe("https://db-editor.example.com/session/123");
  });

  it("should return undefined when location header is absent", async () => {
    const resultPromise = firstValueFrom(
      service.fetchEditorUrl("proj-001", "env-001", "db-financial")
    );

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001/databases/db-financial/editor`
    );
    request.flush(null);

    const result = await resultPromise;
    expect(result).toBeUndefined();
  });

  it("should propagate errors", async () => {
    const resultPromise = firstValueFrom(
      service.fetchEditorUrl("proj-001", "env-001", "db-financial")
    ).catch((error) => error);

    const request = httpController.expectOne(
      `${GATEWAY_URL}projects/proj-001/environments/env-001/databases/db-financial/editor`
    );
    request.flush("Server error", {
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await resultPromise;
    expect(result).toBeInstanceOf(Error);
  });
});
