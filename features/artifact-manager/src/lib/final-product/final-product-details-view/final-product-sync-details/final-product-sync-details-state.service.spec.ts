import { TestBed } from "@angular/core/testing";
import { FinalProductSyncDetailsStateService } from "./final-product-sync-details-state.service";
import {
  EnvironmentDefinition,
  EnvironmentService,
} from "@mxflow/features/environment";
import { of, throwError } from "rxjs";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

describe("FinalProductSyncDetailsStateService", () => {
  let service: FinalProductSyncDetailsStateService;
  let environmentServiceMock: jest.Mocked<
    Pick<EnvironmentService, "getEnvironmentDefinitions">
  >;

  const mockEnvironmentDefinitions = [
    {
      id: "env-1",
      name: "Environment 1",
      status: "ACTIVE",
    },
    {
      id: "env-2",
      name: "Environment 2",
      status: "ACTIVE",
    },
  ] as EnvironmentDefinition[];

  beforeEach(() => {
    environmentServiceMock = {
      getEnvironmentDefinitions: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FinalProductSyncDetailsStateService,
        { provide: EnvironmentService, useValue: environmentServiceMock },
      ],
    });

    service = TestBed.inject(FinalProductSyncDetailsStateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should create the service", () => {
      expect(service).toBeTruthy();
    });

    it("should initialize with empty environment definitions", () => {
      expect(service.environmentDefinitions()).toEqual([]);
    });

    it("should initialize with fetchEnvironmentsLoading as false", () => {
      expect(service.fetchEnvironmentsLoading()).toBe(false);
    });

    it("should initialize with undefined projectId", () => {
      expect(service.projectId()).toBeUndefined();
    });
  });

  describe("setProjectId", () => {
    it("should update projectId signal when setProjectId is called", () => {
      const projectId = "test-project-id";

      service.setProjectId(projectId);

      expect(service.projectId()).toBe(projectId);
    });

    it("should trigger environment definitions fetch when projectId is set", async () => {
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        of(mockEnvironmentDefinitions)
      );

      service.setProjectId("project-1");

      await wait(100);
      expect(
        environmentServiceMock.getEnvironmentDefinitions
      ).toHaveBeenCalledWith("project-1", true);
      expect(service.environmentDefinitions()).toEqual(
        mockEnvironmentDefinitions
      );
    });

    it("should not fetch environment definitions when projectId is undefined", async () => {
      service.setProjectId("project-1");

      await wait(100);
      environmentServiceMock.getEnvironmentDefinitions.mockClear();

      service.projectId.set(undefined);
      await wait(100);

      expect(
        environmentServiceMock.getEnvironmentDefinitions
      ).not.toHaveBeenCalled();
    });
  });

  describe("environment definitions fetching", () => {
    it("should fetch environment definitions successfully", async () => {
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        of(mockEnvironmentDefinitions)
      );

      service.setProjectId("project-1");

      await wait(100);
      expect(service.environmentDefinitions()).toEqual(
        mockEnvironmentDefinitions
      );
      expect(service.fetchEnvironmentsLoading()).toBe(false);
    });

    it("should set loading state to false after successful fetch", async () => {
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        of(mockEnvironmentDefinitions)
      );

      service.setProjectId("project-1");

      await wait(100);
      expect(service.fetchEnvironmentsLoading()).toBe(false);
    });

    it("should update environment definitions when projectId changes", async () => {
      const firstProjectDefinitions = [mockEnvironmentDefinitions[0]];
      const secondProjectDefinitions = [mockEnvironmentDefinitions[1]];

      environmentServiceMock.getEnvironmentDefinitions
        .mockReturnValueOnce(of(firstProjectDefinitions))
        .mockReturnValueOnce(of(secondProjectDefinitions));

      service.setProjectId("project-1");

      await wait(100);
      expect(service.environmentDefinitions()).toEqual(firstProjectDefinitions);

      service.setProjectId("project-2");
      await wait(100);

      expect(service.environmentDefinitions()).toEqual(
        secondProjectDefinitions
      );
      expect(
        environmentServiceMock.getEnvironmentDefinitions
      ).toHaveBeenCalledTimes(2);
      expect(
        environmentServiceMock.getEnvironmentDefinitions
      ).toHaveBeenNthCalledWith(1, "project-1", true);
      expect(
        environmentServiceMock.getEnvironmentDefinitions
      ).toHaveBeenNthCalledWith(2, "project-2", true);
    });

    it("should return empty array when projectId is not set", async () => {
      await wait(100);
      expect(service.environmentDefinitions()).toEqual([]);
      expect(
        environmentServiceMock.getEnvironmentDefinitions
      ).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle error when fetching environment definitions fails", async () => {
      const errorResponse = {
        error: { message: "Server error occurred" },
      };
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        throwError(() => errorResponse)
      );

      let errorMessage: string | undefined;
      service.errorMessage$.subscribe((msg) => {
        errorMessage = msg;
      });

      service.setProjectId("project-1");

      await wait(100);
      expect(errorMessage).toBe(
        "Failed to fetch environment definitions: Server error occurred. Using environment definition ids instead."
      );
      expect(service.environmentDefinitions()).toEqual([]);
      expect(service.fetchEnvironmentsLoading()).toBe(false);
    });

    it("should handle error without error message", async () => {
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        throwError(() => ({}))
      );

      let errorMessage: string | undefined;
      service.errorMessage$.subscribe((msg) => {
        errorMessage = msg;
      });

      service.setProjectId("project-1");

      await wait(100);
      expect(errorMessage).toBe(
        "Failed to fetch environment definitions. Using environment definition ids instead."
      );
      expect(service.environmentDefinitions()).toEqual([]);
      expect(service.fetchEnvironmentsLoading()).toBe(false);
    });

    it("should set loading to false when error occurs", async () => {
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        throwError(() => ({ error: { message: "Error" } }))
      );

      service.setProjectId("project-1");

      await wait(100);
      expect(service.fetchEnvironmentsLoading()).toBe(false);
    });

    it("should emit error message through errorMessage$ observable", async () => {
      const errorResponse = {
        error: { message: "Custom error message" },
      };
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        throwError(() => errorResponse)
      );

      const errorMessages: string[] = [];
      service.errorMessage$.subscribe((msg) => {
        errorMessages.push(msg);
      });

      service.setProjectId("project-1");

      await wait(100);
      expect(errorMessages.length).toBe(1);
      expect(errorMessages[0]).toContain("Custom error message");
    });
  });

  describe("reactivity", () => {
    it("should automatically fetch new environment definitions when projectId changes", async () => {
      const project1Definitions = [mockEnvironmentDefinitions[0]];
      const project2Definitions = [mockEnvironmentDefinitions[1]];

      environmentServiceMock.getEnvironmentDefinitions
        .mockReturnValueOnce(of(project1Definitions))
        .mockReturnValueOnce(of(project2Definitions));

      service.setProjectId("project-1");

      await wait(100);
      expect(service.environmentDefinitions()).toEqual(project1Definitions);

      service.setProjectId("project-2");
      await wait(100);
      expect(service.environmentDefinitions()).toEqual(project2Definitions);
    });
  });

  describe("includeInactive parameter", () => {
    it("should always pass includeInactive as true when fetching environment definitions", async () => {
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        of(mockEnvironmentDefinitions)
      );

      service.setProjectId("project-1");

      await wait(100);
      expect(
        environmentServiceMock.getEnvironmentDefinitions
      ).toHaveBeenCalledWith("project-1", true);
    });
  });

  describe("signal updates", () => {
    it("should update environmentDefinitions signal when new data is received", async () => {
      environmentServiceMock.getEnvironmentDefinitions.mockReturnValue(
        of(mockEnvironmentDefinitions)
      );

      const initialValue = service.environmentDefinitions();
      expect(initialValue).toEqual([]);

      service.setProjectId("project-1");

      await wait(100);
      const updatedValue = service.environmentDefinitions();
      expect(updatedValue).not.toBe(initialValue);
      expect(updatedValue).toEqual(mockEnvironmentDefinitions);
    });

    it("should maintain empty array when no projectId is set", () => {
      expect(service.environmentDefinitions()).toEqual([]);
      expect(
        environmentServiceMock.getEnvironmentDefinitions
      ).not.toHaveBeenCalled();
    });
  });
});
