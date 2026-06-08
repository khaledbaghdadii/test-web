import { TestBed } from "@angular/core/testing";
import { ValidationScopeService } from "./validation-scope.service";
import {
  ArtifactManagerService,
  FactoryProduct,
} from "@mxflow/features/artifact-manager";
import { ValidationScope } from "./model/validation-scope.model";
import { of, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { FactoryProductValidationScope } from "./model/factory-product-validation-scope";

const currentFactoryProductId = "currentFactoryProductId";
const referenceFactoryProductId = "referenceFactoryProductId";
const projectId = "projectId";
const currentVersion = "currentVersion";
const referenceVersion = "referenceVersion";
const validationScope: ValidationScope = {
  currentVersion: currentVersion,
  referenceVersion: referenceVersion,
};
const currentFactoryProduct = {
  softwareProduct: {
    version: currentVersion,
  },
} as unknown as FactoryProduct;
const referenceFactoryProduct = {
  softwareProduct: {
    version: referenceVersion,
  },
} as unknown as FactoryProduct;
const factoryProductValidationScope: FactoryProductValidationScope = {
  requestedfactoryProductId: currentFactoryProductId,
  referenceFactoryProductId: referenceFactoryProductId,
};
const correlationId = "correlationId";

describe("ValidationScopeService", () => {
  let service: ValidationScopeService;
  let artifactManagerService: ArtifactManagerService;
  let httpClient: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: "gatewayUrl/",
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => of(factoryProductValidationScope)),
    } as unknown as HttpClient;

    artifactManagerService = {
      getFactoryProductById: jest.fn(),
    } as unknown as ArtifactManagerService;

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: HttpClient, useValue: httpClient },
        { provide: ArtifactManagerService, useValue: artifactManagerService },
      ],
    });
    service = TestBed.inject(ValidationScopeService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("fetch validation scope", () => {
    it("should fetch the factory product given the current factory product id", () => {
      service.getValidationScope(
        projectId,
        currentFactoryProductId,
        referenceFactoryProductId
      );
      expect(artifactManagerService.getFactoryProductById).toHaveBeenCalledWith(
        currentFactoryProductId,
        projectId
      );
    });

    it("should fetch the reference factory product given the current factory product id", () => {
      service.getValidationScope(
        projectId,
        currentFactoryProductId,
        referenceFactoryProductId
      );
      expect(artifactManagerService.getFactoryProductById).toHaveBeenCalledWith(
        referenceFactoryProductId,
        projectId
      );
    });

    it("should return the validation scope with reference and current mxversions", (done) => {
      jest
        .spyOn(artifactManagerService, "getFactoryProductById")
        .mockReturnValueOnce(of(currentFactoryProduct))
        .mockReturnValueOnce(of(referenceFactoryProduct));

      service
        .getValidationScope(
          projectId,
          currentFactoryProductId,
          referenceFactoryProductId
        )
        .subscribe((data) => {
          expect(data).toEqual(validationScope);
          done();
        });
    });

    it("should not fetch current factory product if current factory product id is missing", () => {
      service.getValidationScope(
        projectId,
        undefined,
        referenceFactoryProductId
      );
      expect(
        artifactManagerService.getFactoryProductById
      ).not.toHaveBeenCalledWith(currentFactoryProduct, projectId);
    });

    it("should return a validation scope with empty currentVersion if current factory product is missing", (done) => {
      jest
        .spyOn(artifactManagerService, "getFactoryProductById")
        .mockReturnValueOnce(of(referenceFactoryProduct));

      service
        .getValidationScope(projectId, undefined, referenceFactoryProductId)
        .subscribe((data) => {
          expect(data).toEqual({
            ...validationScope,
            currentVersion: undefined,
          });
          done();
        });
    });

    it("should not fetch reference factory product if current factory product id is missing", () => {
      service.getValidationScope(projectId, currentFactoryProductId, undefined);
      expect(
        artifactManagerService.getFactoryProductById
      ).not.toHaveBeenCalledWith(referenceFactoryProduct, projectId);
    });

    it("should return a validation scope with empty referenceVersion if reference factory product is missing", (done) => {
      jest
        .spyOn(artifactManagerService, "getFactoryProductById")
        .mockReturnValueOnce(of(currentFactoryProduct));

      service
        .getValidationScope(projectId, currentFactoryProductId, undefined)
        .subscribe((data) => {
          expect(data).toEqual({
            ...validationScope,
            referenceVersion: undefined,
          });
          done();
        });
    });

    it("should throw error on failure to fetch factory product", (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });
      jest
        .spyOn(artifactManagerService, "getFactoryProductById")
        .mockReturnValueOnce(throwError(() => errorResponse));

      service
        .getValidationScope(projectId, currentFactoryProductId, undefined)
        .subscribe({
          error: (err) => {
            expect(err).toEqual("Failed to fetch the validation scope");
            done();
          },
        });
    });
  });

  describe("fetch validation scope by correlation id", () => {
    it("should fetch correlation by id and project id", (done) => {
      service.getValidationScopeByCorrelationId(projectId, correlationId);

      expect(httpClient.get).toHaveBeenCalledWith(
        `${appConfig.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions/${correlationId}`
      );
      done();
    });

    it("should fetch the validation scope given the correlation's reference and current factory products", (done) => {
      const validationFetcherSpy = jest.spyOn(service, "getValidationScope");
      jest
        .spyOn(artifactManagerService, "getFactoryProductById")
        .mockReturnValueOnce(of(currentFactoryProduct))
        .mockReturnValueOnce(of(referenceFactoryProduct));

      service
        .getValidationScopeByCorrelationId(projectId, correlationId)
        .subscribe((actualValidationScope) => {
          expect(actualValidationScope).toEqual(validationScope);
          expect(validationFetcherSpy).toHaveBeenCalledWith(
            projectId,
            currentFactoryProductId,
            referenceFactoryProductId
          );
          done();
        });
    });

    it("should throw error on failure to fetch correlation by id", (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: "failed",
      });
      jest
        .spyOn(httpClient, "get")
        .mockReturnValueOnce(throwError(() => errorResponse));
      service
        .getValidationScopeByCorrelationId(projectId, correlationId)
        .subscribe({
          error: (err) => {
            expect(err).toEqual("Failed to fetch the validation scope");
            done();
          },
        });
    });
  });
});
