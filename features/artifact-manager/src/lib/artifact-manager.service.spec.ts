/* tslint:disable:no-unused-variable */

import { HttpClient } from "@angular/common/http";
import { AppConfig } from "@mxflow/config";
import { lastValueFrom, of } from "rxjs";
import {
  FactoryProductApiResponse,
  FactoryProductsApiResponse,
} from "./api-models/factory-product/factory-product-api-response";
import { ArtifactManagerService } from "./artifact-manager.service";
import { SimpleFactoryProduct } from "./api-models/factory-product/factory-product";
import { Bundles } from "./bundles/model/bundles";

const NAME = "NAME";
const ARTIFACT_URL = "ARTIFACT_URL";
const USERNAME = "USERNAME";
const NEW_USERNAME = "NEW_USERNAME";
const PASSWORD = "PASSWORD";
const ARTIFACT_MANAGER_ID = "4e29eced-c9da-407b-a2ef-405811f42c98";
const EXISTING_ARTIFACT_MANAGER_ID = "4e29eced-0000-0000-0000-405811f42c98";

const PROJECT_ID = "2b2ce6b4-cd66-45e3-bd26-f98e440ec159";
const NEW_ARTIFACT_MANAGER_NAME = "NEW_ARTIFACT_MANAGER_NAME";
const NEW_ARTIFACT_MANAGER_URL = "NEW_ARTIFACT_MANAGER_URL";
const NEW_PASS = "NEW_PASS";
const VALIDATION_DATE = new Date();
const VALIDATION_LEVEL = "CQG";
const SOFTWARE_PRODUCT_PATCH = "PATCH";
const PARENT_FACTORY_PRODUCT_ID = "PARENT_FACTORY_PRODUCT_ID";
const PARENT_FACTORY_PRODUCT: SimpleFactoryProduct = {
  id: PARENT_FACTORY_PRODUCT_ID,
  type: "TYPE",
};
const factoryProductApiResponse = {
  parent: PARENT_FACTORY_PRODUCT,
  createdOn: "2024-07-15T08:46:01.770439Z",
  lastModifiedOn: "2024-07-15T08:46:01.770439Z",
  createdBy: "mxflow-dev-admin",
  lastModifiedBy: "mxflow-dev-admin",
  validationDate: VALIDATION_DATE,
  validationLevel: VALIDATION_LEVEL,
  id: "0a91e12c-05b8-42c4-b2d0-8634acf4995c",
  type: "MAINSTREAM",
  softwareProduct: {
    id: "19fb652a-d352-45e6-9c1a-19d5603a6d1c",
    version: "v3.1.build.archival.2024.0271",
    revision: "7027870",
    patch: SOFTWARE_PRODUCT_PATCH,
    builds: [
      {
        id: "82eec4fd-9907-4785-880b-efe635ed2890",
        purged: false,
        mxBuild: {
          version: "v3.1.build.archival.2024.027",
          buildId: "20005081-240508-1140-73994-SoftwareProductBuildBuildId4",
          revision: "7027870",
          os: "Windows-x86-5.2-64b",
        },
        core: {} as unknown as Bundles,
        mxBundles: [],
      },
    ],
  },
  configurationComponents: [
    {
      id: "3d28381b-6c67-4b39-9db7-e1fc57be9b9d",
      type: "NewBIP",
      version: "archival.2024.027",
      purged: false,
      builds: [
        {
          id: "a1bb9d53-7f68-4981-8a33-ce0d2ec18f09",
          purged: false,
          mxBuild: {
            version: "archival.2024.027",
            buildId: "6ae021d32d6-240412-0701-6698899-bipBuildBuildId",
          },
          mxBundles: [],
        },
      ],
    },
  ],
} as FactoryProductApiResponse;

const factoryProductsApiResponse: FactoryProductsApiResponse = {
  content: [factoryProductApiResponse],
  last: true,
  size: 12,
  number: 2,
  totalElements: 32,
  totalPages: 3,
};

const expectedResponse = {
  content: [
    {
      configurationComponents: [
        {
          builds: [
            {
              id: "a1bb9d53-7f68-4981-8a33-ce0d2ec18f09",
              purged: false,
              mxBuild: {
                buildId: "6ae021d32d6-240412-0701-6698899-bipBuildBuildId",
                version: "archival.2024.027",
              },
              mxBundles: [],
            },
          ],
          id: "3d28381b-6c67-4b39-9db7-e1fc57be9b9d",
          type: "NewBIP",
          version: "archival.2024.027",
          purged: false,
        },
      ],
      parent: PARENT_FACTORY_PRODUCT,
      createdBy: "mxflow-dev-admin",
      createdOn: "2024-07-15T08:46:01.770439Z",
      id: "0a91e12c-05b8-42c4-b2d0-8634acf4995c",
      lastModifiedBy: "mxflow-dev-admin",
      lastModifiedOn: "2024-07-15T08:46:01.770439Z",
      validationDate: VALIDATION_DATE,
      validationLevel: VALIDATION_LEVEL,
      softwareProduct: {
        builds: [
          {
            id: "82eec4fd-9907-4785-880b-efe635ed2890",
            purged: false,
            mxBuild: {
              buildId:
                "20005081-240508-1140-73994-SoftwareProductBuildBuildId4",
              os: "Windows-x86-5.2-64b",
              revision: "7027870",
              version: "v3.1.build.archival.2024.027",
            },
            core: {} as unknown as Bundles,
            mxBundles: [],
          },
        ],
        id: "19fb652a-d352-45e6-9c1a-19d5603a6d1c",
        revision: "7027870",
        version: "v3.1.build.archival.2024.0271",
        patch: SOFTWARE_PRODUCT_PATCH,
      },
      type: "MAINSTREAM",
    },
  ],
  last: true,
  number: 2,
  size: 12,
  totalElements: 32,
  totalPages: 3,
};

const TestData = [
  {
    id: "1ce22a1a-5aca-474b-8871-19a2acb13310",
    name: "test",
    url: "http://something.com",
    credentialsId:
      "project/2b2ce6b4-cd66-45e3-bd26-f98e440ec159/artifact-manager/1ce22a1a-5aca-474b-8871-19a2acb13310",
  },
];

const getExpectedListOfArtifactsManagers = [
  {
    id: "1ce22a1a-5aca-474b-8871-19a2acb13310",
    name: "test",
    url: "http://something.com",
    credentialsId:
      "project/2b2ce6b4-cd66-45e3-bd26-f98e440ec159/artifact-manager/1ce22a1a-5aca-474b-8871-19a2acb13310",
  },
];

const getExpectedArtifactManagerCreateApiResponse = {
  id: ARTIFACT_MANAGER_ID,
  name: NAME,
  url: ARTIFACT_URL,
};

const getExpectedArtifactManagerUpdateApiResponse = {
  id: EXISTING_ARTIFACT_MANAGER_ID,
  name: NEW_ARTIFACT_MANAGER_NAME,
  url: NEW_ARTIFACT_MANAGER_URL,
};

describe("Service: ArtifactManagerService", () => {
  let service: ArtifactManagerService;
  let httpClient: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: "https://gateway.cd.murex.com/api/v1/",
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClient = {
      get: jest.fn((url) => {
        if (
          url ===
          appConfig.gatewayUrl + `projects/${PROJECT_ID}/artifact-managers`
        ) {
          return of(TestData);
        }
        if (
          url ==
          appConfig.gatewayUrl +
            `artifact-management/projects/projectId/factory-products?page=0&size=10&softwareProductVersionFilter=version&sort=createdOn%2Casc`
        ) {
          return of(factoryProductsApiResponse);
        }
        if (
          url ==
          appConfig.gatewayUrl +
            `artifact-management/projects/projectId/factory-products/id`
        ) {
          return of(factoryProductsApiResponse.content[0]);
        }
        return of({});
      }),

      post: jest.fn((url, artifactManagerDetails) => {
        if (
          url ===
          appConfig.gatewayUrl + `projects/${PROJECT_ID}/artifact-managers`
        ) {
          return of({
            id: ARTIFACT_MANAGER_ID,
            name: artifactManagerDetails.name,
            url: artifactManagerDetails.url,
          });
        }
        return {};
      }),

      put: jest.fn((url, artifactManagerDetails) => {
        if (
          url ===
          appConfig.gatewayUrl +
            `projects/${PROJECT_ID}/artifact-managers/${ARTIFACT_MANAGER_ID}`
        ) {
          return of({
            id: EXISTING_ARTIFACT_MANAGER_ID,
            name: artifactManagerDetails.name,
            url: artifactManagerDetails.url,
          });
        }
        return {};
      }),

      delete: jest.fn((url) => {
        if (
          url ===
          appConfig.gatewayUrl +
            `projects/${PROJECT_ID}/artifact-managers/${ARTIFACT_MANAGER_ID}`
        ) {
          return of();
        }
        return {};
      }),
    } as unknown as HttpClient;

    service = new ArtifactManagerService(appConfig, httpClient);
  });

  it("should return all artifacts managers", async () => {
    await expect(
      lastValueFrom(service.getAllArtifactManagers(PROJECT_ID))
    ).resolves.toEqual(getExpectedListOfArtifactsManagers);
  });

  it("should create artifact manager", async () => {
    const result = await lastValueFrom(
      service.createArtifactManager(PROJECT_ID, {
        name: NAME,
        url: ARTIFACT_URL,
        username: USERNAME,
        pass: PASSWORD,
      })
    );

    expect(httpClient.post).toHaveBeenCalledWith(expect.any(String), {
      name: NAME,
      url: ARTIFACT_URL,
      username: USERNAME,
      pass: PASSWORD,
    });

    expect(result).toEqual(getExpectedArtifactManagerCreateApiResponse);
  });

  it("should return correct updated artifact manager", async () => {
    const result = await lastValueFrom(
      service.editArtifactManager(PROJECT_ID, ARTIFACT_MANAGER_ID, {
        name: NEW_ARTIFACT_MANAGER_NAME,
        url: NEW_ARTIFACT_MANAGER_URL,
        username: NEW_USERNAME,
        pass: NEW_PASS,
      })
    );

    expect(httpClient.put).toHaveBeenCalledWith(expect.any(String), {
      name: NEW_ARTIFACT_MANAGER_NAME,
      url: NEW_ARTIFACT_MANAGER_URL,
      username: NEW_USERNAME,
      pass: NEW_PASS,
    });

    expect(result).toEqual(getExpectedArtifactManagerUpdateApiResponse);
  });

  it("should call artifact manager delete endpoint with correct id", async () => {
    service.deleteArtifactManager(PROJECT_ID, ARTIFACT_MANAGER_ID);
    expect(httpClient.delete).toHaveBeenCalledWith(
      appConfig.gatewayUrl +
        `projects/${PROJECT_ID}/artifact-managers/${ARTIFACT_MANAGER_ID}`
    );
  });

  describe("fetch factory product by id", () => {
    it("should return correct factory product by id", async () => {
      const result = await lastValueFrom(
        service.getFactoryProductById("id", "projectId")
      );
      expect(result).toEqual(expectedResponse.content[0]);
    });
  });

  describe("fetch factory products", () => {
    it("should return correctly a factory product", async () => {
      const result = await lastValueFrom(
        service.getFactoryProducts(
          {
            pageSize: 10,
            pageIndex: 0,
            softwareProductVersionFilter: "version",
          },
          "projectId"
        )
      );

      expect(result).toEqual(expectedResponse);
    });

    it("should add software product version filter to http call correctly", async () => {
      service.getFactoryProducts(
        {
          pageSize: 10,
          pageIndex: 0,
          softwareProductVersionFilter: "version",
        },
        "projectId"
      );
      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/factory-products?page=0&size=10&softwareProductVersionFilter=version&sort=createdOn%2Casc`
      );
    });

    it("should set the page size and index correctly", () => {
      service.getFactoryProducts(
        {
          pageSize: 10,
          pageIndex: 0,
        },
        "projectId"
      );

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/factory-products?page=0&size=10&sort=createdOn%2Casc`
      );
    });

    it("should add software product build filter correctly", () => {
      service.getFactoryProducts(
        {
          pageSize: 10,
          pageIndex: 0,
          softwareProductBuildFilter: "build",
        },
        "projectId"
      );

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/factory-products?page=0&size=10&softwareProductBuildIdFilter=build&sort=createdOn%2Casc`
      );
    });

    it("should add software product version search correctly", () => {
      service.getFactoryProducts(
        {
          pageSize: 10,
          pageIndex: 0,
          softwareProductVersionSearch: "versionSearch",
        },
        "projectId"
      );

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/factory-products?page=0&size=10&softwareProductVersionSearch=versionSearch&sort=createdOn%2Casc`
      );
    });

    it("should add configuration component version search correctly", () => {
      service.getFactoryProducts(
        {
          pageSize: 10,
          pageIndex: 0,
          configurationComponentVersionSearch: "configVersionSearch",
        },
        "projectId"
      );

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/factory-products?page=0&size=10&configurationComponentVersionSearch=configVersionSearch&sort=createdOn%2Casc`
      );
    });

    it("should add build id search value correctly", () => {
      service.getFactoryProducts(
        {
          pageSize: 10,
          pageIndex: 0,
          softwareProductBuildSearch: "buildSearch",
        },
        "projectId"
      );

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/factory-products?page=0&size=10&softwareProductBuildIdSearch=buildSearch&sort=createdOn%2Casc`
      );
    });

    it("should add parent factory product id correctly", () => {
      service.getFactoryProducts(
        {
          pageSize: 10,
          pageIndex: 0,
          parentFactoryProductIdFilter: "parentId",
        },
        "projectId"
      );

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/factory-products?page=0&size=10&parentFactoryProductIdFilter=parentId&sort=createdOn%2Casc`
      );
    });
    it("should add all given filters correctly", () => {
      service.getFactoryProducts(
        {
          pageSize: 10,
          pageIndex: 0,
          softwareProductVersionFilter: "version",
          softwareProductBuildFilter: "build",
          softwareProductVersionSearch: "versionSearch",
          configurationComponentVersionSearch: "configVersionSearch",
          parentFactoryProductIdFilter: "parentId",
        },
        "projectId"
      );

      expect(httpClient.get).toHaveBeenCalledWith(
        appConfig.gatewayUrl +
          `artifact-management/projects/projectId/factory-products?page=0&size=10&parentFactoryProductIdFilter=parentId&softwareProductVersionFilter=version&softwareProductBuildIdFilter=build&softwareProductVersionSearch=versionSearch&configurationComponentVersionSearch=configVersionSearch&sort=createdOn%2Casc`
      );
    });
  });
});
