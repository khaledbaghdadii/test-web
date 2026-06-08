import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { ApplicationConnectionService } from "./application-connection.service";
import { firstValueFrom } from "rxjs";
import { ApplicationConnectionApiModel } from "./application-connection-api-model";

const GATEWAY_URL = "https://api.test.com/";

describe("ApplicationConnectionService", () => {
  let service: ApplicationConnectionService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApplicationConnectionService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(ApplicationConnectionService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("fetchSshConnectionUrl", () => {
    it("should fetch ssh connection url without machine id", async () => {
      const apiResponse: ApplicationConnectionApiModel = {
        connectionUrl: "ssh://user@host:22",
      };

      const resultPromise = firstValueFrom(
        service.fetchSshConnectionUrl("proj-001", "env-001")
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/application/ssh-connection`
      );
      expect(request.request.method).toBe("GET");
      request.flush(apiResponse);

      expect(await resultPromise).toEqual({
        connectionUrl: "ssh://user@host:22",
      });
    });

    it("should fetch ssh connection url with machine id", async () => {
      const apiResponse: ApplicationConnectionApiModel = {
        connectionUrl: "ssh://user@host:22",
      };

      const resultPromise = firstValueFrom(
        service.fetchSshConnectionUrl("proj-001", "env-001", "machine-001")
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/application/ssh-connection/machine-001`
      );
      expect(request.request.method).toBe("GET");
      request.flush(apiResponse);

      expect(await resultPromise).toEqual({
        connectionUrl: "ssh://user@host:22",
      });
    });

    it("should propagate errors", async () => {
      const resultPromise = firstValueFrom(
        service.fetchSshConnectionUrl("proj-001", "env-001")
      ).catch((error) => error);

      httpController
        .expectOne(
          `${GATEWAY_URL}projects/proj-001/environments/env-001/application/ssh-connection`
        )
        .error(new ProgressEvent("error"), { statusText: "Server Error" });

      const error = await resultPromise;
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("fetchScpConnectionUrl", () => {
    it("should fetch scp connection url without machine id", async () => {
      const apiResponse: ApplicationConnectionApiModel = {
        connectionUrl: "scp://user@host:22",
      };

      const resultPromise = firstValueFrom(
        service.fetchScpConnectionUrl("proj-001", "env-001")
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/application/scp-connection`
      );
      expect(request.request.method).toBe("GET");
      request.flush(apiResponse);

      expect(await resultPromise).toEqual({
        connectionUrl: "scp://user@host:22",
      });
    });

    it("should fetch scp connection url with machine id", async () => {
      const apiResponse: ApplicationConnectionApiModel = {
        connectionUrl: "scp://user@host:22",
      };

      const resultPromise = firstValueFrom(
        service.fetchScpConnectionUrl("proj-001", "env-001", "machine-001")
      );

      const request = httpController.expectOne(
        `${GATEWAY_URL}projects/proj-001/environments/env-001/application/scp-connection/machine-001`
      );
      expect(request.request.method).toBe("GET");
      request.flush(apiResponse);

      expect(await resultPromise).toEqual({
        connectionUrl: "scp://user@host:22",
      });
    });

    it("should propagate errors", async () => {
      const resultPromise = firstValueFrom(
        service.fetchScpConnectionUrl("proj-001", "env-001")
      ).catch((error) => error);

      httpController
        .expectOne(
          `${GATEWAY_URL}projects/proj-001/environments/env-001/application/scp-connection`
        )
        .error(new ProgressEvent("error"), { statusText: "Server Error" });

      const error = await resultPromise;
      expect(error).toBeInstanceOf(Error);
    });
  });
});
