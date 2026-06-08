import { v4 as uuidv4 } from "uuid";
import { firstValueFrom, lastValueFrom, of, throwError } from "rxjs";
import { BinaryImpactService } from "./binary-impact.service";
import { CreateBinaryImpactRequest } from "./create-binary-impact-modal/create-binary-impact-request.model";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { CreateBinaryImpactResponse } from "./create-binary-impact-response.model";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";
import {
  BinaryImpactPageApiModel,
  FetchBinaryImpactsApiResponse,
} from "./fetch-binary-impacts-api-response.model";
import { LiteBinaryImpactApiResponse } from "./lite-binary-impact-api-response.model";
import {
  EditBinaryImpactRequest,
  LiteBinaryImpact,
} from "@mxflow/features/failure-management";
import { FetchBinaryImpactsQueryApiRequest } from "./fetch-binary-impacts-query-api-request";

import { FetchBinaryImpactsQuery } from "./fetch-binary-impacts-query";
import { BinaryImpactTestUtils } from "./binary-impact-test-utils";

const PROJECT_ID = "projectId";
const BINARY_IMPACT_ID = "binaryImpactId";
const BINARY_IMPACT_TITLE = "title";
const BINARY_IMPACT_MX_VERSION = "mxVersion";
const UPGRADE_IMPACT_ID = "upgradeImpactId";
const BINARY_IMPACT_OWNER = "owner";
const UPGRADE_IMPACT_EXTERNAL_ISSUE_ID = "upgradeImpactExternalIssueId";
const UPGRADE_IMPACT_EXTERNAL_ISSUE_LINK = "upgradeImpactExternalIssueLink";
const ERROR_MESSAGE = "failed";
const ATTACHMENT_ID = "attachmentId";
const BINARY_IMPACT_DESCRIPTION = "description";
const CORRELATION_ID = "CORRELATION_ID";
const FILE_1 = new File([new Blob(["content1"], {})], "attachmentName1", {
  type: "image/png",
});
const ATTACHMENT_LINK = "link";
const WARNING_MESSAGE = "WARNING_MESSAGE";
const RESOLUTION_TYPE = "resolutionType";
const SOURCE_TYPE = "sourceType";
const REGION = "region";
const STREAM = "stream";
const IMPACTED_OUTPUTS = "impactedOutputs";
const CBPM_L1_L2_L3 = ["level1", "level2", "level3"];
const CBPM_L2_SCOPE = ["scope1", "scope2"];
const CBPM_L3_L4 = ["level3", "level4"];

describe("BinaryImpactsService", () => {
  let service: BinaryImpactService;
  let httpClientSpy: HttpClient;
  const appConfig = {
    gatewayUrl: "http://localhost/",
  } as AppConfig;

  const baseUrl = `${appConfig.gatewayUrl}projects/${PROJECT_ID}/failure-management/impacts/binary`;
  const fetchUrl = `${baseUrl}/fetch`;

  beforeEach(() => {
    httpClientSpy = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
    } as unknown as HttpClient;
    TestBed.configureTestingModule({
      providers: [BinaryImpactService],
    })
      .overrideProvider(HttpClient, { useValue: httpClientSpy })
      .overrideProvider(APP_CONFIG, { useValue: appConfig });
    service = TestBed.inject(BinaryImpactService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create binary impact correctly", async () => {
    const response: CreateBinaryImpactResponse = {
      id: BINARY_IMPACT_ID,
    };
    const request: CreateBinaryImpactRequest = getCreateBinaryImpactRequest();
    jest.spyOn(httpClientSpy, "post").mockReturnValue(of(response));

    const data = await lastValueFrom(
      service.createBinaryImpact(PROJECT_ID, request)
    );

    expect(data).toEqual(response);
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(baseUrl, request);
  });

  it("should trim request when creating binary impact", async () => {
    const response: CreateBinaryImpactResponse = {
      id: BINARY_IMPACT_ID,
    };
    const request: CreateBinaryImpactRequest =
      getCreateBinaryImpactTrailingWhiteSpaceRequest();
    const trimmedRequest: CreateBinaryImpactRequest =
      getCreateBinaryImpactRequest();
    jest.spyOn(httpClientSpy, "post").mockReturnValue(of(response));

    const data = await lastValueFrom(
      service.createBinaryImpact(PROJECT_ID, request)
    );
    expect(data).toEqual(response);

    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(baseUrl, trimmedRequest);
  });

  it("should handle error correctly when failing to create binary impact", async () => {
    const errorResponse = new HttpErrorResponse({
      error: ERROR_MESSAGE,
    });
    jest
      .spyOn(httpClientSpy, "post")
      .mockReturnValue(throwError(() => errorResponse));

    await expect(
      lastValueFrom(
        service.createBinaryImpact(PROJECT_ID, getCreateBinaryImpactRequest())
      )
    ).rejects.toHaveProperty("message", ERROR_MESSAGE);
  });

  describe("fetchAll", () => {
    it("should call http client correctly when fetching binary impacts without query params", async () => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchBinaryImpactsApiResponse()));

      const data = await lastValueFrom(service.fetchAll(PROJECT_ID));

      expect(data.binaryImpacts.content).toEqual([getLiteBinaryImpact()]);
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        fetchUrl,
        {},
        {
          params: new HttpParams({
            fromObject: {
              page: "0",
              size: "20",
            },
          }),
        }
      );
    });

    it("should call http client correctly when fetching binary impacts with query params", async () => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchBinaryImpactsApiResponse()));

      const data = await lastValueFrom(
        service.fetchAll(PROJECT_ID, buildFetchBinaryImpactsQuery())
      );
      expect(data.binaryImpacts.content).toEqual([getLiteBinaryImpact()]);
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        fetchUrl,
        buildFetchBinaryImpactsApiQuery(),
        {
          params: new HttpParams({
            fromObject: {
              page: "1",
              size: "10",
            },
          }),
        }
      );
    });

    it("should call http client correctly when fetching binary impacts including those linked to upgrade impacts with no defects", async () => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchBinaryImpactsApiResponse()));

      const data = await firstValueFrom(
        service.fetchAll(
          PROJECT_ID,
          buildFetchBinaryImpactsQueryIncludingNoDefects()
        )
      );

      expect(data.binaryImpacts.content).toEqual([getLiteBinaryImpact()]);
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        fetchUrl,
        buildFetchBinaryImpactsApiQueryIncludingNoDefect(),
        {
          params: new HttpParams({
            fromObject: {
              page: "1",
              size: "10",
            },
          }),
        }
      );
    });

    it("should throw error correctly", async () => {
      const errorResponse = new HttpErrorResponse({
        error: ERROR_MESSAGE,
      });
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(service.fetchAll(PROJECT_ID))
      ).rejects.toHaveProperty("message", ERROR_MESSAGE);
    });

    it("should set warning message correctly when fetching binary impacts in scope", async () => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchBinaryImpactsApiResponse()));

      const data = await firstValueFrom(
        service.fetchAll(PROJECT_ID, buildFetchBinaryImpactsQuery())
      );

      expect(data.binaryImpacts.content).toEqual([getLiteBinaryImpact()]);
      expect(data.warningMessage).toEqual(WARNING_MESSAGE);
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        fetchUrl,
        buildFetchBinaryImpactsApiQuery(),
        {
          params: new HttpParams({
            fromObject: {
              page: "1",
              size: "10",
            },
          }),
        }
      );
    });
  });

  describe("fetchByIds", () => {
    it("should call http client correctly when fetching binary impacts by ids", async () => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of(buildFetchBinaryImpactsApiResponse()));

      const result = await lastValueFrom(
        service.fetchByIds(PROJECT_ID, ["1", "2"])
      );

      expect(result).toEqual([getLiteBinaryImpact()]);
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        fetchUrl,
        { ids: ["1", "2"] } as FetchBinaryImpactsQueryApiRequest,
        {
          params: new HttpParams({
            fromObject: {
              page: "0",
              size: "2",
            },
          }),
        }
      );
    });

    it("should throw error correctly", async () => {
      const errorResponse = new HttpErrorResponse({
        error: ERROR_MESSAGE,
      });

      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(throwError(() => errorResponse));

      await expect(
        lastValueFrom(service.fetchByIds(PROJECT_ID, ["1", "2"]))
      ).rejects.toHaveProperty("message", ERROR_MESSAGE);
    });
  });

  it("should get binary impact by id", async () => {
    const seed = uuidv4();
    const response = BinaryImpactTestUtils.getBinaryImpactApiModel(seed);
    jest.spyOn(httpClientSpy, "get").mockReturnValue(of(response));

    const result = await lastValueFrom(
      service.getById(PROJECT_ID, BINARY_IMPACT_ID)
    );

    expect(result).toEqual(BinaryImpactTestUtils.getBinaryImpact(seed));

    const url = baseUrl + "/binaryImpactId";
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });

  it("should get binary impact by id with optional fields empty", async () => {
    const seed = uuidv4();
    const response = BinaryImpactTestUtils.getBinaryImpactApiModel(seed, {
      impactedOutputs: undefined,
      propagationPattern: undefined,
      configurationDesign: undefined,
      magnitude: undefined,
      identificationPattern: undefined,
      propagationQuery: undefined,
    });
    jest.spyOn(httpClientSpy, "get").mockReturnValue(of(response));

    const result = await lastValueFrom(
      service.getById(PROJECT_ID, BINARY_IMPACT_ID)
    );

    expect(result).toEqual(
      BinaryImpactTestUtils.getBinaryImpact(seed, {
        impactedOutputs: undefined,
        propagationPattern: undefined,
        configurationDesign: undefined,
        magnitude: undefined,
        identificationPattern: undefined,
        propagationQuery: undefined,
      })
    );

    const url = baseUrl + "/binaryImpactId";
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });

  it("should handle error correctly on failure to get binary impact by id", async () => {
    const errorResponse = new HttpErrorResponse({
      error: ERROR_MESSAGE,
    });
    jest
      .spyOn(httpClientSpy, "get")
      .mockReturnValue(throwError(() => errorResponse));

    await expect(
      lastValueFrom(service.getById(PROJECT_ID, BINARY_IMPACT_ID))
    ).rejects.toHaveProperty("message", ERROR_MESSAGE);
  });

  describe("update binary impact", () => {
    it("should send the correct request to the server", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      await lastValueFrom(
        service.update(
          PROJECT_ID,
          BINARY_IMPACT_ID,
          getEditBinaryImpactRequest()
        )
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(
        url,
        getEditBinaryImpactRequest()
      );
    });

    it("should trim the request when editing binary impact", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      await lastValueFrom(
        service.update(
          PROJECT_ID,
          BINARY_IMPACT_ID,
          getEditBinaryImpactTrailingWhiteSpaceRequest()
        )
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(
        url,
        getEditBinaryImpactRequest()
      );
    });

    it("should throw an error server fails", async () => {
      jest.spyOn(httpClientSpy, "put").mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              error: ERROR_MESSAGE,
            })
        )
      );

      await expect(
        lastValueFrom(
          service.update(
            PROJECT_ID,
            BINARY_IMPACT_ID,
            getEditBinaryImpactRequest()
          )
        )
      ).rejects.toHaveProperty("message", ERROR_MESSAGE);
    });

    it("should update region", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      const request: EditBinaryImpactRequest = {
        ...getEditBinaryImpactRequest(),
        region: "newRegion",
      };

      await lastValueFrom(
        service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(url, request);
    });

    it("should update stream", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      const request: EditBinaryImpactRequest = {
        ...getEditBinaryImpactRequest(),
        stream: "newStream",
      };

      await lastValueFrom(
        service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(url, request);
    });

    it("should update resolution type", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      const request: EditBinaryImpactRequest = {
        ...getEditBinaryImpactRequest(),
        resolutionType: "newResolutionType",
      };

      await lastValueFrom(
        service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(url, request);
    });

    it("should update the incident id", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      const request: EditBinaryImpactRequest = {
        ...getEditBinaryImpactRequest(),
        incidentId: "newIncidentId",
      };

      await lastValueFrom(
        service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(url, request);
    });

    it("should update source type", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      const request: EditBinaryImpactRequest = {
        ...getEditBinaryImpactRequest(),
        sourceType: "newSourceType",
      };

      await lastValueFrom(
        service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(url, request);
    });

    it("should update cbpmL1L2L3", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      const request: EditBinaryImpactRequest = {
        ...getEditBinaryImpactRequest(),
        cbpmL1L2L3: ["newLevel1", "newLevel2"],
      };

      await lastValueFrom(
        service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(url, request);
    });

    it("should update cbpmL2Scope", async () => {
      const url = baseUrl + `/${BINARY_IMPACT_ID}`;
      jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

      const request: EditBinaryImpactRequest = {
        ...getEditBinaryImpactRequest(),
        cbpmL2Scope: ["newScope1", "newScope2"],
      };

      await lastValueFrom(
        service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
      );
      expect(httpClientSpy.put).toHaveBeenCalledWith(url, request);
    });

    it.each([undefined, "new magnitude"])(
      "should update magnitude to %s",
      async (magnitude) => {
        jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

        const request: EditBinaryImpactRequest = {
          ...getEditBinaryImpactRequest(),
          magnitude: magnitude,
        };

        await lastValueFrom(
          service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
        );
        expect(httpClientSpy.put).toHaveBeenCalledWith(
          baseUrl + `/${BINARY_IMPACT_ID}`,
          request
        );
      }
    );

    it.each([undefined, "new impacted outputs"])(
      "should update impacted outputs to %s",
      async (impactedOutputs) => {
        jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

        const request: EditBinaryImpactRequest = {
          ...getEditBinaryImpactRequest(),
          impactedOutputs: impactedOutputs,
        };

        await lastValueFrom(
          service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
        );
        expect(httpClientSpy.put).toHaveBeenCalledWith(
          baseUrl + `/${BINARY_IMPACT_ID}`,
          request
        );
      }
    );

    it.each([undefined, "new identification pattern"])(
      "should update identification pattern to %s",
      async (identificationPattern) => {
        jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

        const request: EditBinaryImpactRequest = {
          ...getEditBinaryImpactRequest(),
          identificationPattern: identificationPattern,
        };

        await lastValueFrom(
          service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
        );
        expect(httpClientSpy.put).toHaveBeenCalledWith(
          baseUrl + `/${BINARY_IMPACT_ID}`,
          request
        );
      }
    );

    it.each([undefined, "new propagation pattern"])(
      "should update propagation pattern to %s",
      async (propagationPattern) => {
        jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

        const request: EditBinaryImpactRequest = {
          ...getEditBinaryImpactRequest(),
          propagationPattern: propagationPattern,
        };

        await lastValueFrom(
          service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
        );
        expect(httpClientSpy.put).toHaveBeenCalledWith(
          baseUrl + `/${BINARY_IMPACT_ID}`,
          request
        );
      }
    );

    it.each([undefined, "new propagation query"])(
      "should update propagation query to %s",
      async (propagationQuery) => {
        jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

        const request: EditBinaryImpactRequest = {
          ...getEditBinaryImpactRequest(),
          propagationQuery: propagationQuery,
        };

        await lastValueFrom(
          service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
        );
        expect(httpClientSpy.put).toHaveBeenCalledWith(
          baseUrl + `/${BINARY_IMPACT_ID}`,
          request
        );
      }
    );

    it.each([undefined, "new configuration design"])(
      "should update configuration design to %s",
      async (configurationDesign) => {
        jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));

        const request: EditBinaryImpactRequest = {
          ...getEditBinaryImpactRequest(),
          configurationDesign: configurationDesign,
        };

        await lastValueFrom(
          service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
        );
        expect(httpClientSpy.put).toHaveBeenCalledWith(
          baseUrl + `/${BINARY_IMPACT_ID}`,
          request
        );
      }
    );

    it.each([undefined, ["newCbpmL3", "newCbpmL4"]])(
      "should update cbpmL3L4 to %s",
      async (cbpmL3L4) => {
        jest.spyOn(httpClientSpy, "put").mockReturnValue(of(null));
        const request: EditBinaryImpactRequest = {
          ...getEditBinaryImpactRequest(),
          cbpmL3L4: cbpmL3L4,
        };

        await lastValueFrom(
          service.update(PROJECT_ID, BINARY_IMPACT_ID, request)
        );
        expect(httpClientSpy.put).toHaveBeenCalledWith(
          baseUrl + `/${BINARY_IMPACT_ID}`,
          request
        );
      }
    );
  });

  describe("upload attachment", () => {
    it("should upload the attachment correctly", async () => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(of({ downloadLink: ATTACHMENT_LINK }));
      const data = await lastValueFrom(
        service.upload(PROJECT_ID, BINARY_IMPACT_ID, FILE_1)
      );
      expect(data).toEqual({
        downloadLink: ATTACHMENT_LINK,
      });
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        `${baseUrl}/${BINARY_IMPACT_ID}/attachment`,
        getAttachmentFormData()
      );
    });
    it("should handle error correctly if failed to upload attachment", async () => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          throwError(() => new HttpErrorResponse({ error: ERROR_MESSAGE }))
        );

      await expect(
        lastValueFrom(service.upload(PROJECT_ID, BINARY_IMPACT_ID, FILE_1))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });
    });
  });
});

function buildFetchBinaryImpactsApiResponse(): FetchBinaryImpactsApiResponse {
  return {
    binaryImpacts: buildBinaryImpactApiPage(),
    warningMessage: WARNING_MESSAGE,
  } as FetchBinaryImpactsApiResponse;
}

function buildBinaryImpactApiPage(): BinaryImpactPageApiModel {
  return {
    content: [getLiteBinaryImpactApiResponse()],
    totalElements: 1,
  } as BinaryImpactPageApiModel;
}

function getLiteBinaryImpactApiResponse(): LiteBinaryImpactApiResponse {
  return {
    id: BINARY_IMPACT_ID,
    owner: BINARY_IMPACT_OWNER,
    title: BINARY_IMPACT_TITLE,
    projectId: PROJECT_ID,
    mxVersion: BINARY_IMPACT_MX_VERSION,
    upgradeImpact: {
      id: UPGRADE_IMPACT_ID,
      externalIssue: {
        id: UPGRADE_IMPACT_EXTERNAL_ISSUE_ID,
        link: UPGRADE_IMPACT_EXTERNAL_ISSUE_LINK,
      },
    },
  } as LiteBinaryImpactApiResponse;
}

function getLiteBinaryImpact(): LiteBinaryImpact {
  return {
    id: BINARY_IMPACT_ID,
    owner: BINARY_IMPACT_OWNER,
    title: BINARY_IMPACT_TITLE,
    projectId: PROJECT_ID,
    mxVersion: BINARY_IMPACT_MX_VERSION,
    upgradeImpact: {
      id: UPGRADE_IMPACT_ID,
      externalIssue: {
        id: UPGRADE_IMPACT_EXTERNAL_ISSUE_ID,
        link: UPGRADE_IMPACT_EXTERNAL_ISSUE_LINK,
      },
    },
  } as LiteBinaryImpact;
}

function buildFetchBinaryImpactsQuery(): FetchBinaryImpactsQuery {
  return {
    page: 1,
    size: 10,
    ids: ["1", "2"],
    titlePhrase: "title1",
    upgradeImpactExternalIssuePhrase: "issue",
    mxVersionPhrases: ["mx1", "mx2"],
    ownerPhrase: "owner",
    referenceVersion: "referenceVersion",
    currentVersion: "currentVersion",
    returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact: false,
  } as FetchBinaryImpactsQuery;
}

function buildFetchBinaryImpactsQueryIncludingNoDefects(): FetchBinaryImpactsQuery {
  return {
    page: 1,
    size: 10,
    ids: ["1", "2"],
    titlePhrase: "title1",
    upgradeImpactExternalIssuePhrase: "issue",
    mxVersionPhrases: ["mx1", "mx2"],
    ownerPhrase: "owner",
    referenceVersion: "referenceVersion",
    currentVersion: "currentVersion",
    returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact: true,
  } as FetchBinaryImpactsQuery;
}

function buildFetchBinaryImpactsApiQuery(): FetchBinaryImpactsQueryApiRequest {
  return {
    ids: ["1", "2"],
    titlePhrase: "title1",
    upgradeImpactExternalIssuePhrase: "issue",
    mxVersionPhrases: ["mx1", "mx2"],
    ownerPhrase: "owner",
    referenceVersion: "referenceVersion",
    currentVersion: "currentVersion",
    returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact: false,
  } as FetchBinaryImpactsQueryApiRequest;
}

function buildFetchBinaryImpactsApiQueryIncludingNoDefect(): FetchBinaryImpactsQueryApiRequest {
  return {
    ids: ["1", "2"],
    titlePhrase: "title1",
    upgradeImpactExternalIssuePhrase: "issue",
    mxVersionPhrases: ["mx1", "mx2"],
    ownerPhrase: "owner",
    referenceVersion: "referenceVersion",
    currentVersion: "currentVersion",
    returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact: true,
  } as FetchBinaryImpactsQueryApiRequest;
}

function getCreateBinaryImpactTrailingWhiteSpaceRequest(): CreateBinaryImpactRequest {
  return {
    title: BINARY_IMPACT_TITLE + " ",
    description: BINARY_IMPACT_DESCRIPTION,
    mxVersion: BINARY_IMPACT_MX_VERSION + " ",
    upgradeImpactId: UPGRADE_IMPACT_ID,
    attachmentIds: [ATTACHMENT_ID],
    correlationId: CORRELATION_ID,
    resolutionType: RESOLUTION_TYPE,
    region: REGION,
    sourceType: SOURCE_TYPE,
    stream: STREAM,
    impactedOutputs: IMPACTED_OUTPUTS,
    cbpmL1L2L3: CBPM_L1_L2_L3,
    cbpmL2Scope: CBPM_L2_SCOPE,
    cbpmL3L4: CBPM_L3_L4,
    identificationPattern: IDENTIFICATION_PATTERN,
    propagationPattern: PROPAGATION_PATTERN,
    propagationQuery: PROPAGATION_QUERY,
    configurationDesign: CONFIGURATION_DESIGN,
    magnitude: MAGNITUDE,
    incidentId: INCIDENT_ID,
  };
}

const IDENTIFICATION_PATTERN = "identificationPattern";

const PROPAGATION_PATTERN = "propagationPattern";

const PROPAGATION_QUERY = "propagationQuery";

const CONFIGURATION_DESIGN = "configurationDesign";

const MAGNITUDE = "magnitude";
const INCIDENT_ID = "incidentId";

function getCreateBinaryImpactRequest(): CreateBinaryImpactRequest {
  return {
    title: BINARY_IMPACT_TITLE,
    description: BINARY_IMPACT_DESCRIPTION,
    mxVersion: BINARY_IMPACT_MX_VERSION,
    upgradeImpactId: UPGRADE_IMPACT_ID,
    attachmentIds: [ATTACHMENT_ID],
    correlationId: CORRELATION_ID,
    resolutionType: RESOLUTION_TYPE,
    sourceType: SOURCE_TYPE,
    region: REGION,
    stream: STREAM,
    impactedOutputs: IMPACTED_OUTPUTS,
    cbpmL1L2L3: CBPM_L1_L2_L3,
    cbpmL2Scope: CBPM_L2_SCOPE,
    cbpmL3L4: CBPM_L3_L4,
    identificationPattern: IDENTIFICATION_PATTERN,
    propagationPattern: PROPAGATION_PATTERN,
    propagationQuery: PROPAGATION_QUERY,
    configurationDesign: CONFIGURATION_DESIGN,
    magnitude: MAGNITUDE,
    incidentId: INCIDENT_ID,
  };
}

function getEditBinaryImpactRequest(): EditBinaryImpactRequest {
  return {
    title: BINARY_IMPACT_TITLE,
    description: BINARY_IMPACT_DESCRIPTION,
    upgradeImpactId: UPGRADE_IMPACT_ID,
    region: REGION,
    stream: STREAM,
    sourceType: SOURCE_TYPE,
    resolutionType: RESOLUTION_TYPE,
    cbpmL1L2L3: CBPM_L1_L2_L3,
    cbpmL2Scope: CBPM_L2_SCOPE,
  };
}

function getEditBinaryImpactTrailingWhiteSpaceRequest(): EditBinaryImpactRequest {
  return {
    title: BINARY_IMPACT_TITLE + " ",
    description: BINARY_IMPACT_DESCRIPTION + " ",
    upgradeImpactId: UPGRADE_IMPACT_ID,
    region: REGION,
    stream: STREAM,
    sourceType: SOURCE_TYPE,
    resolutionType: RESOLUTION_TYPE,
    cbpmL1L2L3: CBPM_L1_L2_L3,
    cbpmL2Scope: CBPM_L2_SCOPE,
  };
}

function getAttachmentFormData() {
  const formData = new FormData();
  formData.append("file", FILE_1);
  return formData;
}
