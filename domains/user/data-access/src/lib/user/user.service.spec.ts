import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { firstValueFrom } from "rxjs";
import { UserService } from "./user.service";

const GATEWAY_URL = "https://api.test.com/";

describe("UserService", () => {
  let service: UserService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService,
        { provide: GATEWAY_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });

    service = TestBed.inject(UserService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe("fetchByIds", () => {
    it("returns an empty array when no IDs are provided", async () => {
      const result = await firstValueFrom(service.fetchByIds("project-1", []));

      expect(result).toEqual([]);
    });

    it("fetches each user by ID and combines results", async () => {
      const result$ = firstValueFrom(
        service.fetchByIds("project-1", ["user-1", "user-2"])
      );

      const req1 = httpController.expectOne(
        `${GATEWAY_URL}projects/project-1/users/user-1`
      );
      const req2 = httpController.expectOne(
        `${GATEWAY_URL}projects/project-1/users/user-2`
      );
      req1.flush({
        id: "user-1",
        displayName: "Alice",
        mail: "alice@test.com",
      });
      req2.flush({ id: "user-2", displayName: "Bob", mail: "bob@test.com" });

      const result = await result$;

      expect(result).toEqual([
        { id: "user-1", displayName: "Alice", mail: "alice@test.com" },
        { id: "user-2", displayName: "Bob", mail: "bob@test.com" },
      ]);
    });

    it("throws an error when any user fetch fails", async () => {
      const result$ = firstValueFrom(
        service.fetchByIds("project-1", ["user-1", "user-2"])
      );

      const req1 = httpController.expectOne(
        `${GATEWAY_URL}projects/project-1/users/user-1`
      );
      const req2 = httpController.expectOne(
        `${GATEWAY_URL}projects/project-1/users/user-2`
      );
      req1.flush({
        id: "user-1",
        displayName: "Alice",
        mail: "alice@test.com",
      });
      req2.flush("Not Found", { status: 404, statusText: "Not Found" });

      await expect(result$).rejects.toMatchObject({ status: 404 });
    });
  });
});
