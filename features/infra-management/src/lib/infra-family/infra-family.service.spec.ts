import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { InfraFamilyService } from "./infra-family.service";
import { InfraFamilyApiResponse } from "./model/infra-family.model";
import { provideHttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

describe("InfraFamilyService", () => {
  let service: InfraFamilyService;
  let httpMock: HttpTestingController;
  const mockGatewayUrl = "https://mock-gateway-url.com";
  const mockConfig: AppConfig = { gatewayUrl: mockGatewayUrl } as AppConfig;
  const PROJECT_ID = "test-project-id";

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InfraFamilyService,
        { provide: APP_CONFIG, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(InfraFamilyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("getInfraFamilies", () => {
    it("should be created", () => {
      expect(service).toBeTruthy();
    });

    it("should return mapped infra families", async () => {
      const apiResponse: InfraFamilyApiResponse[] = [
        {
          id: "1",
          name: "Family 1",
          projectId: PROJECT_ID,
          description: "Description 1",
          createdOn: "2026-01-12T14:49:51.785Z",
          lastModifiedOn: "2026-01-12T14:49:51.785Z",
          createdBy: "user1",
          lastModifiedBy: "user1",
        },
        {
          id: "2",
          name: "Family 2",
          projectId: PROJECT_ID,
          description: "Description 2",
          createdOn: "2026-01-12T15:00:00.000Z",
          lastModifiedOn: "2026-01-12T15:00:00.000Z",
          createdBy: "user2",
          lastModifiedBy: "user2",
        },
      ];

      const resultPromise = firstValueFrom(
        service.getInfraFamilies(PROJECT_ID)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families`
      );
      expect(req.request.method).toBe("GET");
      req.flush(apiResponse);

      await expect(resultPromise).resolves.toEqual([
        {
          id: "1",
          name: "Family 1",
          projectId: PROJECT_ID,
          description: "Description 1",
          createdOn: "2026-01-12T14:49:51.785Z",
          lastModifiedOn: "2026-01-12T14:49:51.785Z",
          createdBy: "user1",
          lastModifiedBy: "user1",
        },
        {
          id: "2",
          name: "Family 2",
          projectId: PROJECT_ID,
          description: "Description 2",
          createdOn: "2026-01-12T15:00:00.000Z",
          lastModifiedOn: "2026-01-12T15:00:00.000Z",
          createdBy: "user2",
          lastModifiedBy: "user2",
        },
      ]);

      const result = await resultPromise;
      expect(result.length).toBe(2);
    });

    it("should return empty array when no infra families exist", async () => {
      const apiResponse: InfraFamilyApiResponse[] = [];

      const resultPromise = firstValueFrom(
        service.getInfraFamilies(PROJECT_ID)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families`
      );
      expect(req.request.method).toBe("GET");
      req.flush(apiResponse);

      await expect(resultPromise).resolves.toEqual([]);

      const result = await resultPromise;
      expect(result.length).toBe(0);
    });

    it("should throw error on http failure", async () => {
      const resultPromise = firstValueFrom(
        service.getInfraFamilies(PROJECT_ID)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });

      await expect(resultPromise).rejects.toBeInstanceOf(Error);
      await expect(resultPromise).rejects.toHaveProperty(
        "message",
        "Could not fetch infra families"
      );
    });
  });

  describe("createInfraFamily", () => {
    it("should successfully create an infra family", async () => {
      const createRequest = {
        name: "New Family",
        description: "New Description",
      };

      const apiResponse: InfraFamilyApiResponse = {
        id: "new-id-123",
        name: "New Family",
        projectId: PROJECT_ID,
        description: "New Description",
        createdOn: "2026-02-02T10:00:00.000Z",
        lastModifiedOn: "2026-02-02T10:00:00.000Z",
        createdBy: "test-user",
        lastModifiedBy: "test-user",
      };

      const resultPromise = firstValueFrom(
        service.createInfraFamily(PROJECT_ID, createRequest)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families`
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(createRequest);
      req.flush(apiResponse);

      await expect(resultPromise).resolves.toEqual({
        id: "new-id-123",
        name: "New Family",
        projectId: PROJECT_ID,
        description: "New Description",
        createdOn: "2026-02-02T10:00:00.000Z",
        lastModifiedOn: "2026-02-02T10:00:00.000Z",
        createdBy: "test-user",
        lastModifiedBy: "test-user",
      });
    });

    it("should create infra family without description", async () => {
      const createRequest = {
        name: "Family Without Description",
      };

      const apiResponse: InfraFamilyApiResponse = {
        id: "new-id-456",
        name: "Family Without Description",
        projectId: PROJECT_ID,
        description: "",
        createdOn: "2026-02-02T10:00:00.000Z",
        lastModifiedOn: "2026-02-02T10:00:00.000Z",
        createdBy: "test-user",
        lastModifiedBy: "test-user",
      };

      const resultPromise = firstValueFrom(
        service.createInfraFamily(PROJECT_ID, createRequest)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families`
      );
      expect(req.request.method).toBe("POST");
      req.flush(apiResponse);

      const result = await resultPromise;
      expect(result.name).toBe("Family Without Description");
      expect(result.id).toBe("new-id-456");
    });

    it("should throw error when create fails with server error", async () => {
      const createRequest = {
        name: "Failed Family",
        description: "This will fail",
      };

      const resultPromise = firstValueFrom(
        service.createInfraFamily(PROJECT_ID, createRequest)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families`
      );
      req.flush("Server error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(resultPromise).rejects.toBeInstanceOf(Error);
      await expect(resultPromise).rejects.toHaveProperty(
        "message",
        "Could not create infra family"
      );
    });

    it("should throw error with custom message when backend returns error message", async () => {
      const createRequest = {
        name: "Duplicate Family",
        description: "This name already exists",
      };

      const errorResponse = {
        message: "Infra family with this name already exists",
      };

      const resultPromise = firstValueFrom(
        service.createInfraFamily(PROJECT_ID, createRequest)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families`
      );
      req.flush(errorResponse, {
        status: 409,
        statusText: "Conflict",
      });

      await expect(resultPromise).rejects.toBeInstanceOf(Error);
      await expect(resultPromise).rejects.toHaveProperty(
        "message",
        "Infra family with this name already exists"
      );
    });

    it("should throw error when validation fails", async () => {
      const createRequest = {
        name: "",
        description: "Invalid request",
      };

      const resultPromise = firstValueFrom(
        service.createInfraFamily(PROJECT_ID, createRequest)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families`
      );
      req.flush("Bad request", {
        status: 400,
        statusText: "Bad Request",
      });

      await expect(resultPromise).rejects.toBeInstanceOf(Error);
      await expect(resultPromise).rejects.toHaveProperty(
        "message",
        "Could not create infra family"
      );
    });
  });

  describe("deleteInfraFamily", () => {
    const INFRA_FAMILY_ID = "test-family-id";

    it("should successfully delete an infra family", async () => {
      const resultPromise = firstValueFrom(
        service.deleteInfraFamily(PROJECT_ID, INFRA_FAMILY_ID)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families/${INFRA_FAMILY_ID}`
      );
      expect(req.request.method).toBe("DELETE");
      req.flush(null);

      await expect(resultPromise).resolves.toBeNull();
    });

    it("should throw error when delete fails", async () => {
      const resultPromise = firstValueFrom(
        service.deleteInfraFamily(PROJECT_ID, INFRA_FAMILY_ID)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families/${INFRA_FAMILY_ID}`
      );
      req.flush("Delete failed", {
        status: 500,
        statusText: "Server Error",
      });

      await expect(resultPromise).rejects.toBeInstanceOf(Error);
      await expect(resultPromise).rejects.toHaveProperty(
        "message",
        "Could not delete infra family"
      );
    });

    it("should throw error when infra family not found", async () => {
      const resultPromise = firstValueFrom(
        service.deleteInfraFamily(PROJECT_ID, INFRA_FAMILY_ID)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families/${INFRA_FAMILY_ID}`
      );
      req.flush("Not found", {
        status: 404,
        statusText: "Not Found",
      });

      await expect(resultPromise).rejects.toBeInstanceOf(Error);
      await expect(resultPromise).rejects.toHaveProperty(
        "message",
        "Could not delete infra family"
      );
    });
  });

  describe("getInfraFamilyById", () => {
    const INFRA_FAMILY_ID = "family-1-id";

    it("should return mapped infra family", async () => {
      const apiResponse: InfraFamilyApiResponse = {
        id: INFRA_FAMILY_ID,
        name: "Family 1",
        projectId: PROJECT_ID,
        description: "Description 1",
        createdOn: "2026-01-12T14:49:51.785Z",
        lastModifiedOn: "2026-01-12T14:49:51.785Z",
        createdBy: "user1",
        lastModifiedBy: "user1",
      };

      const resultPromise = firstValueFrom(
        service.getInfraFamilyById(PROJECT_ID, INFRA_FAMILY_ID)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families/${INFRA_FAMILY_ID}`
      );
      expect(req.request.method).toBe("GET");
      req.flush(apiResponse);

      await expect(resultPromise).resolves.toEqual({
        id: INFRA_FAMILY_ID,
        name: "Family 1",
        projectId: PROJECT_ID,
        description: "Description 1",
        createdOn: "2026-01-12T14:49:51.785Z",
        lastModifiedOn: "2026-01-12T14:49:51.785Z",
        createdBy: "user1",
        lastModifiedBy: "user1",
      });
    });

    it("should throw error on http failure", async () => {
      const resultPromise = firstValueFrom(
        service.getInfraFamilyById(PROJECT_ID, INFRA_FAMILY_ID)
      );

      const req = httpMock.expectOne(
        `${mockGatewayUrl}projects/${PROJECT_ID}/infra/infra-families/${INFRA_FAMILY_ID}`
      );
      req.flush("Something went wrong", {
        status: 500,
        statusText: "Server Error",
      });

      await expect(resultPromise).rejects.toBeInstanceOf(Error);
      await expect(resultPromise).rejects.toHaveProperty(
        "message",
        "Could not fetch infra family"
      );
    });
  });
});
