import { UpgradeImpactDataService } from "./upgrade-impact-data.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { of, throwError } from "rxjs";
import { FetchUpgradeImpactsQueryResult } from "./model/lite-upgrade-impact.model";
import { FetchUpgradeImpactsApiQueryResult } from "./model/lite-upgrade-impact-api.model";
import { UpgradeImpact } from "./model/upgrade-impact.model";
import { UpgradeImpactApiModel } from "./model/upgrade-impact-api.model";
import { FetchUpgradeImpactsQuery } from "./model/fetch-upgrade-impacts-query.model";
import { TestBed } from "@angular/core/testing";

const WARNING_MESSAGE = "warningMessage";

describe("Service: UpgradeImpactData", () => {
  let service: UpgradeImpactDataService;
  let httpClientSpy: HttpClient;
  const appConfig = {
    gatewayUrl: "http://localhost/",
  } as AppConfig;

  const url = `${appConfig.gatewayUrl}failure-management/impacts/upgrade`;

  beforeEach(() => {
    httpClientSpy = {
      get: jest.fn(),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [UpgradeImpactDataService],
    })
      .overrideProvider(HttpClient, { useValue: httpClientSpy })
      .overrideProvider(APP_CONFIG, { useValue: appConfig });

    service = TestBed.inject(UpgradeImpactDataService);
  });

  describe("get all upgrade impacts", () => {
    it("should get impacts correclty", (done) => {
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(of(getFetchUpgradeImpactsApiQueryResult()));

      service.fetchAll(getFetchUpgradeImpactQuery()).subscribe((data) => {
        const queryParams = new HttpParams({
          fromObject: { ...getFetchUpgradeImpactQuery() },
        });

        expect(data).toEqual(getFetchUpgradeImpactsQueryResult());

        expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.get).toHaveBeenCalledWith(url, {
          params: queryParams,
        });
        done();
      });
    });

    it("should exclude undefined criteria from query parametrs", (done) => {
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(of(getFetchUpgradeImpactsApiQueryResult()));
      const query: FetchUpgradeImpactsQuery = {
        page: 0,
        size: 10,
        currentVersion: undefined,
      };

      service.fetchAll(query).subscribe((data) => {
        const queryParams = new HttpParams({
          fromObject: { page: 0, size: 10 },
        });

        expect(data).toEqual(getFetchUpgradeImpactsQueryResult());

        expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.get).toHaveBeenCalledWith(url, {
          params: queryParams,
        });
        done();
      });
    });

    it("should throw error if failed to get upgrade impacts", (done) => {
      const errorMessage = "Error";
      const httpErrorResponse = new HttpErrorResponse({
        status: 500,
        error: errorMessage,
      });

      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValueOnce(throwError(() => httpErrorResponse));

      service.fetchAll(getFetchUpgradeImpactQuery()).subscribe({
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
          done();
        },
      });
    });

    it("should modify warning message if returned", (done) => {
      const modifiedWarningMessage = `Showing all upgrade impacts due to: ${WARNING_MESSAGE}. Data includes upgrade impacts outside the validation cycle.`;
      const apiResultWithWarningMessage = {
        ...getFetchUpgradeImpactsApiQueryResult(),
        warningMessage: WARNING_MESSAGE,
      };
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(of(apiResultWithWarningMessage));

      service.fetchAll(getFetchUpgradeImpactQuery()).subscribe((data) => {
        const queryParams = new HttpParams({
          fromObject: { ...getFetchUpgradeImpactQuery() },
        });

        expect(data).toEqual({
          ...getFetchUpgradeImpactsQueryResult(),
          warningMessage: modifiedWarningMessage,
        });

        expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.get).toHaveBeenCalledWith(url, {
          params: queryParams,
        });
        done();
      });
    });
  });

  describe("get upgrade impact by id", () => {
    it("should get upgrade impact by id correclty", (done) => {
      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValue(of(getUpgradeImpactApiModel()));

      service.fetchById("upgradeImpactId").subscribe((data) => {
        expect(data).toEqual(getUpgradeImpact());

        expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.get).toHaveBeenCalledWith(
          `${url}/upgradeImpactId`
        );
        done();
      });
    });

    it("should throw error on failure to get upgrade impact by id", (done) => {
      const errorMessage = "Error";
      const httpErrorResponse = new HttpErrorResponse({
        status: 500,
        error: errorMessage,
      });

      jest
        .spyOn(httpClientSpy, "get")
        .mockReturnValueOnce(throwError(() => httpErrorResponse));

      service.fetchById("upgradeImpactId").subscribe({
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
          done();
        },
      });
    });
  });
});

function getUpgradeImpactApiModel(): UpgradeImpactApiModel {
  return {
    id: "id",
    title: "title",
    fullDescription: "fullDescription",
    impactType: "impactType",
    impactDocumentationTrigger: "impactDocumentationTrigger",
    introducedInArchival: ["introducedInArchival"],
    introducedInReleaseVersion: ["introducedInReleaseVersion"],
    impactedOutputs: "impactedOutputs",
    impactedInstrumentsScope: ["impactedInstrumentsScope"],
    bpcFFTopic: ["bpcFFTopic"],
    defects: [
      {
        defectId: "defectId",
        defectLink: "defectLink",
      },
    ],
    externalIssue: {
      id: "id",
      origin: "origin",
      link: "link",
    },
    attachments: [
      {
        attachmentId: "attachmentId",
        upgradeImpactId: "upgradeImpactId",
        name: "name",
        type: "type",
        downloadLink: "downloadLink",
        externalAttachment: {
          id: "id",
          origin: "origin",
        },
      },
    ],
  };
}

function getFetchUpgradeImpactQuery(): FetchUpgradeImpactsQuery {
  return {
    page: 0,
    size: 10,
    titlePhrases: ["titlePhrases"],
    descriptionPhrase: "descriptionPhrases",
    externalIssueIdPhrases: ["externalIssueIdPhrases"],
    introducedInArchivalPhrases: ["introducedInArchivalPhrases"],
    introducedInReleaseVersionPhrases: ["introducedInReleaseVersionPhrases"],
    defectIdPhrases: ["defectIdPhrases"],
    bpcFfTopicPhrases: ["bpcFfTopicPhrases"],
    impactedInstrumentsScopePhrases: ["impactedInstrumentsScopePhrases"],
    impactedOutputsPhrases: ["impactedOutputsPhrases"],
    currentVersion: "currentVersion",
    referenceVersion: "referenceVersion",
  };
}

function getUpgradeImpact(): UpgradeImpact {
  return {
    id: "id",
    title: "title",
    fullDescription: "fullDescription",
    impactType: "impactType",
    impactDocumentationTrigger: "impactDocumentationTrigger",
    introducedInArchival: ["introducedInArchival"],
    introducedInReleaseVersion: ["introducedInReleaseVersion"],
    impactedOutputs: "impactedOutputs",
    impactedInstrumentsScope: ["impactedInstrumentsScope"],
    bpcFFTopic: ["bpcFFTopic"],
    defects: [
      {
        defectId: "defectId",
        defectLink: "defectLink",
      },
    ],
    externalIssue: {
      id: "id",
      origin: "origin",
      link: "link",
    },
    attachments: [
      {
        attachmentId: "attachmentId",
        upgradeImpactId: "upgradeImpactId",
        name: "name",
        type: "type",
        downloadLink: "downloadLink",
        externalAttachment: {
          id: "id",
          origin: "origin",
        },
      },
    ],
  };
}

function getFetchUpgradeImpactsApiQueryResult(): FetchUpgradeImpactsApiQueryResult {
  return {
    upgradeImpacts: {
      totalElements: 0,
      content: [
        {
          id: "id",
          title: "title",
          textOnlyDescription: "textOnlyDescription",
          impactType: "impactType",
          impactDocumentationTrigger: "impactDocumentationTrigger",
          introducedInArchival: ["introducedInArchival"],
          introducedInReleaseVersion: ["introducedInReleaseVersion"],
          impactedOutputs: "impactedOutputs",
          impactedInstrumentsScope: ["impactedInstrumentsScope"],
          bpcFFTopic: ["bpcFFTopic"],
          defects: [
            {
              defectId: "defectId",
              defectLink: "defectLink",
            },
          ],
          externalIssue: {
            id: "id",
            origin: "origin",
            link: "link",
          },
        },
      ],
    },
  };
}

function getFetchUpgradeImpactsQueryResult(): FetchUpgradeImpactsQueryResult {
  return {
    upgradeImpacts: {
      totalElements: 0,
      content: [
        {
          id: "id",
          title: "title",
          textOnlyDescription: "textOnlyDescription",
          impactType: "impactType",
          impactDocumentationTrigger: "impactDocumentationTrigger",
          introducedInArchival: ["introducedInArchival"],
          introducedInReleaseVersion: ["introducedInReleaseVersion"],
          impactedOutputs: "impactedOutputs",
          impactedInstrumentsScope: ["impactedInstrumentsScope"],
          bpcFFTopic: ["bpcFFTopic"],
          defects: [
            {
              defectId: "defectId",
              defectLink: "defectLink",
            },
          ],
          externalIssue: {
            id: "id",
            origin: "origin",
            link: "link",
          },
        },
      ],
    },
  };
}
