import { of, throwError } from "rxjs";
import { BinaryImpactTableStateService } from "./binary-impact-table-state.service";
import {
  BinaryImpactService,
  LiteBinaryImpact,
} from "@mxflow/features/failure-management";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import {
  BinaryImpactPageModel,
  FetchBinaryImpactsResponse,
} from "../fetch-binary-impacts-response.model";
import { FetchBinaryImpactsQuery } from "../fetch-binary-impacts-query";
import { FetchBinaryImpactsTableQuery } from "./fetch-binary-impacts-table-query.model";
import { Store } from "@ngrx/store";
import { ValidationScope } from "@mxflow/features/validation-management";

function getFirstBinaryImpact(): LiteBinaryImpact {
  return {
    id: "id1",
    projectId: "project1",
    title: "title1",
    upgradeImpact: {
      id: "upgradeImpactId1",
      externalIssue: {
        id: "upgradeImpactExternalIssueId1",
        link: "upgradeImpactExternalIssueLink1",
      },
    },
    mxVersion: "mxVersion1",
    owner: "owner1",
  };
}

function getSecondBinaryImpact(): LiteBinaryImpact {
  return {
    id: "id2",
    projectId: "project2",
    title: "title2",
    upgradeImpact: {
      id: "upgradeImpactId2",
      externalIssue: {
        id: "upgradeImpactExternalIssueId2",
        link: "upgradeImpactExternalIssueLink2",
      },
    },
    mxVersion: "mxVersion2",
    owner: "owner2",
  };
}

function getFirstBinaryImpactPage(): BinaryImpactPageModel {
  return {
    content: [getFirstBinaryImpact()],
    totalElements: 2,
  };
}

function getSecondBinaryImpactPage(): BinaryImpactPageModel {
  return {
    content: [getSecondBinaryImpact()],
    totalElements: 2,
  };
}

function getFirstFetchBinaryImpactResponse(): FetchBinaryImpactsResponse {
  return { binaryImpacts: getFirstBinaryImpactPage() };
}

function getSecondFetchBinaryImpactResponse(): FetchBinaryImpactsResponse {
  return { binaryImpacts: getSecondBinaryImpactPage() };
}

function getDefaultFetchBinaryImpactsRequest(): FetchBinaryImpactsQuery {
  return {
    page: 0,
    size: 10,
    ids: undefined,
    titlePhrase: undefined,
    ownerPhrase: undefined,
    mxVersionPhrases: undefined,
    upgradeImpactExternalIssuePhrase: undefined,
    currentVersion: undefined,
    referenceVersion: undefined,
    returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact: false,
  };
}

function getValidationScope(): ValidationScope {
  return {
    currentVersion: "currentVersion",
    referenceVersion: "referenceVersion",
  };
}

function getFetchBinaryImpactsRequest(): FetchBinaryImpactsQuery {
  return {
    page: 1,
    size: 20,
    ids: ["id1", "id2"],
    titlePhrase: "title1",
    ownerPhrase: "owner",
    mxVersionPhrases: ["mxVersion1", "mxVersion2"],
    upgradeImpactExternalIssuePhrase: "upgradeImpactExternalIssuePhrase",
    currentVersion: "currentVersion",
    referenceVersion: "referenceVersion",
    returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact: false,
  };
}

function getBinaryImpactTableQuery(): FetchBinaryImpactsTableQuery {
  return {
    page: 1,
    pageSize: 20,
    titlePhrases: "title1",
    ownerPhrase: "owner",
    mxVersionPhrases: ["mxVersion1", "mxVersion2"],
    upgradeImpactExternalIssuePhrase: "upgradeImpactExternalIssuePhrase",
  };
}

function getEmptyResult(): FetchBinaryImpactsResponse {
  return {
    binaryImpacts: {
      content: [],
      totalElements: 0,
    },
  };
}

const PROJECT_ID = "project1";
const ERROR_MESSAGE = "errorMessage";
const WARNING_MESSAGE = "warningMessage";

function getFetchBinaryImpactResponseWithWarning(): FetchBinaryImpactsResponse {
  return {
    binaryImpacts: getFirstBinaryImpactPage(),
    warningMessage: WARNING_MESSAGE,
  };
}

describe("BinaryImpactTableStateService", () => {
  let service: BinaryImpactTableStateService;
  let binaryImpactDataService: BinaryImpactService;
  let store: Store;

  beforeEach(() => {
    store = {
      select: jest.fn(() => of(PROJECT_ID)),
    } as unknown as Store;

    binaryImpactDataService = {
      fetchAll: jest.fn(() => of(getFirstFetchBinaryImpactResponse())),
    } as unknown as BinaryImpactService;

    TestBed.configureTestingModule({
      providers: [
        BinaryImpactService,
        BinaryImpactTableStateService,
        {
          provide: BinaryImpactService,
          useValue: binaryImpactDataService,
        },
        { provide: Store, useValue: store },
      ],
    });

    service = TestBed.inject(BinaryImpactTableStateService);
    service["_projectId"].set("project1");
    TestBed.tick();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("initialization", () => {
    it("should fetch the projectId form the store correctly", () => {
      expect(service.projectId()).toEqual(PROJECT_ID);
    });

    it("should set to undefined if failed to fetch the project id from the store", () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(throwError(() => ERROR_MESSAGE));
      expect(service.errorMessage()).toBeUndefined();
    });

    it("should initialize binary impacts request signal correctly", () => {
      expect(service["fetchBinaryImpactsRequest"]()).toEqual(
        getDefaultFetchBinaryImpactsRequest()
      );
    });

    it("should initialize returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact signal to false", () => {
      expect(
        service["returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact"]()
      ).toBeFalsy();
    });

    it("should initialize page index to 0", () => {
      expect(service.page()).toEqual(0);
    });

    it("should initialize page size to 10", () => {
      expect(service.size()).toEqual(10);
    });

    it("should compute binary impacts request signal from nested signals", () => {
      service["ids"].set(["id1", "id2"]);
      service["titlePhrase"].set("title1");
      service["mxVersionPhrases"].set(["mxVersion1", "mxVersion2"]);
      service["upgradeImpactExternalIssuePhrase"].set(
        "upgradeImpactExternalIssuePhrase"
      );
      service["ownerPhrase"].set("owner");
      service["pageIndex"].set(1);
      service["pageSize"].set(20);
      service["currentVersion"].set("currentVersion");
      service["referenceVersion"].set("referenceVersion");
      service["returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact"].set(
        false
      );
      expect(service["fetchBinaryImpactsRequest"]()).toStrictEqual(
        getFetchBinaryImpactsRequest()
      );
    });

    it("should compute binary impact page from fetch binary impacts response", fakeAsync(() => {
      expect(service.binaryImpactsPage()).toEqual(getFirstBinaryImpactPage());

      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryImpactResponse()));
      service["pageIndex"].set(1);
      tick();

      expect(service.binaryImpactsPage()).toEqual(getSecondBinaryImpactPage());
    }));

    it("should compute binary impacts content from binary impacts page", fakeAsync(() => {
      expect(service.binaryImpacts()).toEqual([getFirstBinaryImpact()]);

      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryImpactResponse()));
      service["pageIndex"].set(1);
      tick();

      expect(service.binaryImpacts()).toEqual([getSecondBinaryImpact()]);
    }));

    it("should compute total elements from binary impacts page", fakeAsync(() => {
      expect(service.totalElements()).toEqual(2);

      jest.spyOn(binaryImpactDataService, "fetchAll").mockReturnValueOnce(
        of({
          binaryImpacts: {
            ...getSecondBinaryImpactPage(),
            totalElements: 12,
          },
        })
      );
      service["pageIndex"].set(1);
      tick();

      expect(service.totalElements()).toEqual(12);
    }));

    it("should initialize error message signal correctly", fakeAsync(() => {
      tick();
      expect(service.errorMessage()).toBeUndefined();
    }));

    it("should initialize isLoading signal correctly", () => {
      expect(service.isLoading()).toBeFalsy();
    });

    it("should initialize warning message signal correctly", () => {
      expect(service.warningMessage()).toBeUndefined();
    });

    it("should compute warning message from fetch defect result", fakeAsync(() => {
      expect(service.warningMessage()).toBeUndefined();

      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(of(getFetchBinaryImpactResponseWithWarning()));
      service["pageIndex"].set(1);
      tick();
      expect(service.warningMessage()).toEqual(WARNING_MESSAGE);
    }));
  });

  describe("set validation scope", () => {
    it.each(["criteria", undefined])(
      "should set the current version criteria in validation scope",
      (criteria) => {
        const signalSpy = jest.spyOn(service["currentVersion"], "set");
        const validationScope = {
          ...getValidationScope(),
          currentVersion: criteria,
        };
        service.setValidationScope(validationScope);
        expect(signalSpy).toHaveBeenCalledWith(criteria);
      }
    );

    it.each(["criteria", undefined])(
      "should set the reference version criteria in validation scope",
      (criteria) => {
        const signalSpy = jest.spyOn(service["referenceVersion"], "set");
        const validationScope = {
          ...getValidationScope(),
          referenceVersion: criteria,
        };
        service.setValidationScope(validationScope);
        expect(signalSpy).toHaveBeenCalledWith(criteria);
      }
    );

    it("should reset the page index", () => {
      service.setBinaryImpactsTableQuery({
        page: 1,
      } as FetchBinaryImpactsTableQuery);
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setValidationScope(getValidationScope());
      expect(signalSpy).toHaveBeenCalledWith(0);
    });
  });

  describe("refresh binary impacts", () => {
    it("refresh should be behavioural subject with false initial value", async () => {
      service["refresh$"].subscribe((refresh) => {
        expect(refresh).toBeFalsy();
      });
    });

    it("should emit a refresh event when refresh is called", fakeAsync(() => {
      const refreshSpy = jest.spyOn(service["refresh$"], "next");
      service.refreshBinaryImpacts(true);
      tick();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not refresh after component is destroyed", fakeAsync(() => {
      jest.clearAllMocks();
      service.ngOnDestroy();
      tick();
      service.refreshBinaryImpacts(true);
      tick();
      expect(binaryImpactDataService.fetchAll).not.toHaveBeenCalled();
    }));
  });

  describe("setBinaryImpactsTableQuery", () => {
    it("should set the page index", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setBinaryImpactsTableQuery(getBinaryImpactTableQuery());
      expect(signalSpy).toHaveBeenCalledWith(1);
    });

    it("should default the page index to 0 when not passed", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setBinaryImpactsTableQuery({
        titlePhrases: "title1",
        ownerPhrase: "owner",
        mxVersionPhrases: ["mxVersion1", "mxVersion2"],
        upgradeImpactExternalIssuePhrase: "upgradeImpactExternalIssuePhrase",
      } as unknown as FetchBinaryImpactsTableQuery);
      expect(signalSpy).toHaveBeenCalledWith(0);
    });

    it("should set the page size", () => {
      const signalSpy = jest.spyOn(service["pageSize"], "set");
      service.setBinaryImpactsTableQuery(getBinaryImpactTableQuery());
      expect(signalSpy).toHaveBeenCalledWith(20);
    });

    it("should default the page size to 10 when not passed", () => {
      const signalSpy = jest.spyOn(service["pageSize"], "set");
      service.setBinaryImpactsTableQuery({
        titlePhrases: "title1",
        ownerPhrase: "owner",
        mxVersionPhrases: ["mxVersion1", "mxVersion2"],
        upgradeImpactExternalIssuePhrase: "upgradeImpactExternalIssuePhrase",
      } as unknown as FetchBinaryImpactsTableQuery);
      expect(signalSpy).toHaveBeenCalledWith(10);
    });

    it.each([
      [getBinaryImpactTableQuery(), getBinaryImpactTableQuery().titlePhrase],
      [{ ...getBinaryImpactTableQuery(), titlePhrase: undefined }, undefined],
    ])("should set the title phrases", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["titlePhrase"], "set");
      service.setBinaryImpactsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getBinaryImpactTableQuery(),
        getBinaryImpactTableQuery().mxVersionPhrases,
      ],
      [
        { ...getBinaryImpactTableQuery(), mxVersionPhrases: undefined },
        undefined,
      ],
    ])("should set the mxVersion phrases", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["mxVersionPhrases"], "set");
      service.setBinaryImpactsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getBinaryImpactTableQuery(),
        getBinaryImpactTableQuery().upgradeImpactExternalIssuePhrase,
      ],
      [
        {
          ...getBinaryImpactTableQuery(),
          upgradeImpactExternalIssuePhrase: undefined,
        },
        undefined,
      ],
    ])("should set the fix phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(
        service["upgradeImpactExternalIssuePhrase"],
        "set"
      );
      service.setBinaryImpactsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [getBinaryImpactTableQuery(), getBinaryImpactTableQuery().ownerPhrase],
      [{ ...getBinaryImpactTableQuery(), ownerPhrase: undefined }, undefined],
    ])("should set the owner phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["ownerPhrase"], "set");
      service.setBinaryImpactsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });
  });

  describe("showImpactsWithoutDefects", () => {
    it.each([true, false])(
      "should set the returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact signal",
      (criteria) => {
        const signalSpy = jest.spyOn(
          service["returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact"],
          "set"
        );
        service.showImpactsWithoutDefects(criteria);
        expect(signalSpy).toHaveBeenCalledWith(criteria);
      }
    );
  });

  describe("fetch binary impacts page", () => {
    it("should fetch binary impacts page with all query fields correctly", fakeAsync(() => {
      service["pageIndex"].set(1);
      service["pageSize"].set(20);
      service["_projectId"].set("project1");
      service["ids"].set(["id1", "id2"]);
      service["titlePhrase"].set("title1");
      service["mxVersionPhrases"].set(["mxVersion1", "mxVersion2"]);
      service["upgradeImpactExternalIssuePhrase"].set(
        "upgradeImpactExternalIssuePhrase"
      );
      service["ownerPhrase"].set("owner");
      service["currentVersion"].set("currentVersion");
      service["referenceVersion"].set("referenceVersion");
      service["returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact"].set(
        false
      );
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledWith(
        "project1",
        getFetchBinaryImpactsRequest()
      );
    }));

    it("should fetch the binary impacts page again when page index changes", fakeAsync(() => {
      expect(service["pageIndex"]()).toEqual(0);
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryImpactResponse()));
      service["pageIndex"].set(1);
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(2);
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledWith(
        "project1",

        getDefaultFetchBinaryImpactsRequest()
      );
    }));

    it("should fetch binary impacts page again when refresh$ emits a new value", fakeAsync(() => {
      jest.clearAllMocks();
      expect(service["refresh$"].value).toBeFalsy();
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(of(getFirstFetchBinaryImpactResponse()));
      service.refreshBinaryImpacts(true);
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(1);
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledWith(
        "project1",
        getDefaultFetchBinaryImpactsRequest()
      );
      expect(service["refresh$"].value).toBeTruthy();
    }));

    it("should fetch the binary impacts page again when page size changes", fakeAsync(() => {
      expect(service["pageSize"]()).toEqual(10);
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryImpactResponse()));
      service["pageSize"].set(20);
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(2);
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledWith(
        "project1",
        getDefaultFetchBinaryImpactsRequest()
      );
    }));

    it("should not fetch the binary impacts page again if the page index is set to the same value", fakeAsync(() => {
      expect(service["pageIndex"]()).toEqual(0);
      service["pageIndex"].set(0);
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the binary impacts page again if the page size is set to the same value", fakeAsync(() => {
      expect(service["pageSize"]()).toEqual(10);
      service["pageSize"].set(10);
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the binary impacts page again if the ids are set to the same value", fakeAsync(() => {
      expect(service["fetchBinaryImpactsRequest"]().ids).toBeUndefined();
      service["ids"].set(undefined);
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should set isLoading to true when fetching binary impacts", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service["_isLoading"], "set");
      service["pageIndex"].set(1);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set isLoading to false when fetching binary impacts failed", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service["_isLoading"], "set");
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));

    it("should default result to an empty page when there is a failure while fetching binary impacts", fakeAsync(() => {
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(service.fetchBinaryImpactResponse()).toEqual(getEmptyResult());
      expect(service.binaryImpacts()).toEqual([]);
    }));

    it("should set error message signal on failure to fetch binary impacts", fakeAsync(() => {
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(service.errorMessage()).toEqual("failure");
    }));

    it("should reinitialize the list of binary impacts on failure to fetch binary impacts", fakeAsync(() => {
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryImpactResponse()));
      service["pageIndex"].set(1);
      tick();
      expect(service.binaryImpacts()).toEqual([getSecondBinaryImpact()]);
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(2);
      tick();
      expect(service.binaryImpacts()).toEqual([]);
    }));
    it("should set the warning message to undefined before fetching binary impacts", fakeAsync(() => {
      const warningMessageSpy = jest.spyOn(service["_warningMessage"], "set");
      service["pageIndex"].set(1);
      tick();
      expect(warningMessageSpy).toHaveBeenCalledWith(undefined);
    }));

    it("should set the warning message from the fetch binary impacts response", fakeAsync(() => {
      const warningMessageSpy = jest.spyOn(service["_warningMessage"], "set");
      jest
        .spyOn(binaryImpactDataService, "fetchAll")
        .mockReturnValueOnce(of(getFetchBinaryImpactResponseWithWarning()));
      service["pageIndex"].set(1);
      tick();
      expect(warningMessageSpy).toHaveBeenCalledWith(WARNING_MESSAGE);
    }));

    it("should fetch binary impacts page again when the return impacts not linked to any defect signal changes", fakeAsync(() => {
      tick();
      jest.spyOn(binaryImpactDataService, "fetchAll");
      expect(
        service["returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact"]()
      ).toBeFalsy();
      service.showImpactsWithoutDefects(true);
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(2);
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        {
          ...getDefaultFetchBinaryImpactsRequest(),
          returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact: true,
        }
      );
    }));
  });

  describe("ngOnDestroy", () => {
    it("should emit a value on the destroy$ subject", () => {
      const destroySpy = jest.spyOn(service["destroy$"], "next");
      service.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalledWith({});
    });
    it("should complete the destroy$ subject", () => {
      const destroySpy = jest.spyOn(service["destroy$"], "complete");
      service.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it("should not fetch binary impacts when the service is destroyed", fakeAsync(() => {
      service.ngOnDestroy();
      tick();
      service["pageIndex"].set(2);
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch binary impacts when the service is destroyed and the fetch binary impacts request signal changes", fakeAsync(() => {
      service.ngOnDestroy();
      tick();
      service["titlePhrase"].set("title2");
      tick();
      expect(binaryImpactDataService.fetchAll).toHaveBeenCalledTimes(1);
    }));
  });
});
