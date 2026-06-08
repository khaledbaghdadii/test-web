import { ProjectUsersService } from "./project-users.service";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { lastValueFrom } from "rxjs";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("ProjectUsersService", () => {
  let service: ProjectUsersService;
  let httpMock: HttpTestingController;
  const MOCK_GATEWAY_URL = "https://mock-gateway-url.com/";
  const PROJECT_ID = "PROJECT_ID";
  const fetchUsersRequest = {
    projectId: PROJECT_ID,
    pageSize: 10,
    pageIndex: 0,
    searchKey: "john",
  };
  const response = {
    users: [{ id: "user-1", displayName: "John Doe", email: "john@doe.com" }],
    last: true,
  };
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };
  describe("getProjectUsers", () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          ProjectUsersService,
          {
            provide: APP_CONFIG,
            useValue: mockAppConfig,
          },
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });
      httpMock = TestBed.inject(HttpTestingController);
      service = TestBed.inject(ProjectUsersService);
    });
    afterEach(() => {
      httpMock.verify();
    });
    it("should fetch users when all params are provided", async () => {
      const usersPromise = lastValueFrom(
        service.getProjectUsers(fetchUsersRequest)
      );
      const request = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}user-management/projects/${PROJECT_ID}/users?size=${fetchUsersRequest.pageSize}&page=${fetchUsersRequest.pageIndex}&searchKey=${fetchUsersRequest.searchKey}`
      );
      request.flush(response);

      expect(request.request.method).toBe("GET");
      await expect(usersPromise).resolves.toEqual(response);
    });
    it("should fetch users when searchKey is not provided", async () => {
      const requestWithoutSearchKey = {
        projectId: PROJECT_ID,
        pageSize: 10,
        pageIndex: 0,
        searchKey: "",
      };
      const usersPromise = lastValueFrom(
        service.getProjectUsers(requestWithoutSearchKey)
      );
      const request = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}user-management/projects/${PROJECT_ID}/users?size=${requestWithoutSearchKey.pageSize}&page=${requestWithoutSearchKey.pageIndex}`
      );
      request.flush(response);

      expect(request.request.method).toBe("GET");
      await expect(usersPromise).resolves.toEqual(response);
    });
    it("should propagate error when the request to fetch users fails", async () => {
      const errorMessage = "Failed to fetch users";
      const usersPromise = lastValueFrom(
        service.getProjectUsers(fetchUsersRequest)
      );
      const request = httpMock.expectOne(
        `${MOCK_GATEWAY_URL}user-management/projects/${PROJECT_ID}/users?size=${fetchUsersRequest.pageSize}&page=${fetchUsersRequest.pageIndex}&searchKey=${fetchUsersRequest.searchKey}`
      );
      request.flush(
        { message: errorMessage },
        { status: 500, statusText: "Server Error" }
      );

      await expect(usersPromise).rejects.toThrow(errorMessage);
    });
  });
});
