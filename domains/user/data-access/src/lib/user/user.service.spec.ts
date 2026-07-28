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

  describe("fetchUsersByEmails", () => {
    it("fetches users by email in a given project", async () => {
      const result$ = firstValueFrom(
        service.fetchUsersByEmails("project-1", [
          "alice@test.com",
          "bob@test.com",
        ])
      );

      const req = httpController.expectOne(
        (r) =>
          r.url === `${GATEWAY_URL}user-management/projects/project-1/users`
      );
      expect(req.request.params.getAll("userEmails")).toEqual([
        "alice@test.com",
        "bob@test.com",
      ]);
      req.flush({
        content: [
          { id: "user-1", displayName: "Alice", mail: "alice@test.com" },
          { id: "user-2", displayName: "Bob", mail: "bob@test.com" },
        ],
      });

      const result = await result$;

      expect(result.content).toHaveLength(2);
      expect(result.content[0].id).toBe("user-1");
      expect(result.content[1].id).toBe("user-2");
    });

    it("throws an error when the fetch fails", async () => {
      const result$ = firstValueFrom(
        service.fetchUsersByEmails("project-1", ["alice@test.com"])
      ).catch((e) => e);

      httpController
        .expectOne(
          (r) =>
            r.url === `${GATEWAY_URL}user-management/projects/project-1/users`
        )
        .flush("Not Found", {
          status: 500,
          statusText: "Internal Server Error",
        });

      const error = await result$;
      expect(error).toBeInstanceOf(Error);
    });
  });
});
