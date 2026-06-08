import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { SoftwareProductBuildService } from "./software-product-build.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  CustomizedBundle,
  CustomizeSoftwareProductBuildApiRequest,
} from "./model/software-product-build.model";
import { SoftwareProductBuildResponse } from "../api-models/factory-product/factory-product";
import { provideHttpClient } from "@angular/common/http";
import { Bundles } from "@mxflow/features/artifact-manager";

describe("SoftwareProductBuildService", () => {
  const BUNDLE_ID_1 = "BUNDLE_ID_1";
  const ARTIFACT_ID = "ARTIFACT_ID";
  const STORAGE_ID = "STORAGE_ID";
  const RELATIVE_PATH = "RELATIVE_PATH";
  const STORAGE_ID_2 = "STORAGE_ID_2";
  const RELATIVE_PATH_2 = "RELATIVE_PATH_2";

  const CUSTOMIZED_BUNDLE: CustomizedBundle = {
    bundleId: BUNDLE_ID_1,
    customizedMxDeployPackage: {
      storageId: STORAGE_ID,
      relativePath: RELATIVE_PATH,
    },
    customizedArtifacts: [
      {
        artifactId: ARTIFACT_ID,
        storageId: STORAGE_ID_2,
        relativePath: RELATIVE_PATH_2,
      },
    ],
  };

  const API_REQuEST: CustomizeSoftwareProductBuildApiRequest = {
    customizedBundles: [CUSTOMIZED_BUNDLE],
  };

  const BUILD_ID = "BUILD_ID";
  const PROJECT_ID = "PROJECT_ID";
  const MX_BUILD_VERSION = "1.0.0";
  const MX_BUILD_REVISION = "REV_1";
  const MX_BUILD_OS = "linux";
  const MX_BUNDLE_ID_1 = "MX_BUNDLE_ID_1";
  const MX_BUNDLE_ID_2 = "MX_BUNDLE_ID_2";
  const MX_BUNDLE_TYPE = "DEPLOY";

  const MOCK_SOFTWARE_PRODUCT_BUILD_RESPONSE: SoftwareProductBuildResponse = {
    id: BUILD_ID,
    projectId: PROJECT_ID,
    purged: false,
    mxBuild: {
      version: MX_BUILD_VERSION,
      buildId: BUILD_ID,
      revision: MX_BUILD_REVISION,
      os: MX_BUILD_OS,
    },
    mxBundles: [
      { id: MX_BUNDLE_ID_1, type: MX_BUNDLE_TYPE },
      { id: MX_BUNDLE_ID_2, type: MX_BUNDLE_TYPE },
    ],
    customizedMxBundles: [{ id: MX_BUNDLE_ID_1, type: MX_BUNDLE_TYPE }],
    core: {} as unknown as Bundles,
  };
  const MOCK_BASE_URI = "http://test-api/";

  let service: SoftwareProductBuildService;
  let httpMock: HttpTestingController;
  const mockConfig: AppConfig = { gatewayUrl: MOCK_BASE_URI } as AppConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SoftwareProductBuildService,
        { provide: APP_CONFIG, useValue: mockConfig },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SoftwareProductBuildService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("customizeSoftwareProductBuild test", () => {
    it("should send POST request and return response", (done) => {
      service
        .customizeSoftwareProductBuild(API_REQuEST, BUILD_ID, PROJECT_ID)
        .subscribe((response) => {
          expect(response).toEqual(MOCK_SOFTWARE_PRODUCT_BUILD_RESPONSE);
          done();
        });

      const req = httpMock.expectOne(
        `${MOCK_BASE_URI}artifact-management/projects/${PROJECT_ID}/software-product-builds/${BUILD_ID}/customized-bundles`
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(API_REQuEST);
      req.flush(MOCK_SOFTWARE_PRODUCT_BUILD_RESPONSE);
    });

    it("should handle error response", (done) => {
      const errorMessage = "Error occurred";
      service
        .customizeSoftwareProductBuild(API_REQuEST, BUILD_ID, PROJECT_ID)
        .subscribe({
          error: (error) => {
            expect(error.status).toBe(500);
            expect(error.error).toBe(errorMessage);
            done();
          },
        });

      const req = httpMock.expectOne(
        `${MOCK_BASE_URI}artifact-management/projects/${PROJECT_ID}/software-product-builds/${BUILD_ID}/customized-bundles`
      );
      expect(req.request.method).toBe("POST");
      req.flush(errorMessage, { status: 500, statusText: "Server Error" });
    });
  });
});
