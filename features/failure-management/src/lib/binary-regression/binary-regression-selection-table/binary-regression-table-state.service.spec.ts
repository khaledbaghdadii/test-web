import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { BinaryRegressionTableStateService } from "./binary-regression-table-state.service";
import {
  FetchBinaryRegressionsRequest,
  Pageable,
} from "../model/fetch-binary-regressions-request";
import { of, throwError } from "rxjs";
import { BinaryRegressionTableQuery } from "./binary-regression-table-query.model";
import {
  BinaryRegressionPage,
  FetchBinaryRegressionsResponse,
  LiteBinaryRegression,
} from "../model/lite-binary-regression.model";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import { ValidationScope } from "@mxflow/features/validation-management";

function getEmptyResult(): FetchBinaryRegressionsResponse {
  return {
    binaryRegressions: {
      content: [],
      totalElements: 0,
    },
  };
}

function getFirstBinaryRegression(): LiteBinaryRegression {
  return {
    id: "id1",
    projectId: "project1",
    title: "title1",
    defect: { id: "defect1", link: "/defect1" },
    fix: "fix1",
    mxVersion: "mxVersion1",
    owner: "owner1",
  };
}

function getSecondBinaryRegression(): LiteBinaryRegression {
  return {
    id: "id2",
    projectId: "project2",
    title: "title2",
    defect: { id: "defect2", link: "/defect2" },
    fix: "fix2",
    mxVersion: "mxVersion2",
    owner: "owner2",
  };
}

function getFirstBinaryRegressionPage(): BinaryRegressionPage {
  return {
    content: [getFirstBinaryRegression()],
    totalElements: 2,
  };
}

function getSecondBinaryRegressionPage(): BinaryRegressionPage {
  return {
    content: [getSecondBinaryRegression()],
    totalElements: 2,
  };
}

function getFirstFetchBinaryRegressionResponse(): FetchBinaryRegressionsResponse {
  return { binaryRegressions: getFirstBinaryRegressionPage() };
}

function getSecondFetchBinaryRegressionResponse(): FetchBinaryRegressionsResponse {
  return { binaryRegressions: getSecondBinaryRegressionPage() };
}

const WARNING_MESSAGE = "warningMessage";

function getFetchBinaryRegressionResponseWithWarning(): FetchBinaryRegressionsResponse {
  return {
    binaryRegressions: getFirstBinaryRegressionPage(),
    warningMessage: WARNING_MESSAGE,
  };
}

function getBinaryRegressionTableQuery(): BinaryRegressionTableQuery {
  return {
    page: 1,
    pageSize: 20,
    fixPhrase: "fix",
    ownerPhrase: "owner",
    titlePhrases: ["title1", "title2"],
    defectIdPhrases: ["defect1", "defect2"],
    mxVersionPhrases: ["mxVersion1", "mxVersion2"],
  } as BinaryRegressionTableQuery;
}

function getDefaultPageable(): Pageable {
  return {
    page: 0,
    size: 10,
  };
}

function getDefaultFetchBinaryRegressionsRequest(): FetchBinaryRegressionsRequest {
  return {
    ids: undefined,
    ownerPhrase: undefined,
    fixPhrase: undefined,
    titlePhrases: undefined,
    defectIdPhrases: undefined,
    mxVersionPhrases: undefined,
    currentVersion: undefined,
    referenceVersion: undefined,
    returnBinaryRegressionsNotLinkedToAnyDefect: false,
  };
}

function getValidationScope(): ValidationScope {
  return {
    currentVersion: "currentVersion",
    referenceVersion: "referenceVersion",
  };
}

function getPageable(): Pageable {
  return {
    page: 1,
    size: 20,
  };
}

function getFetchBinaryRegressionsRequest(): FetchBinaryRegressionsRequest {
  return {
    ownerPhrase: "owner",
    fixPhrase: "fix",
    titlePhrases: ["title1", "title2"],
    defectIdPhrases: ["defect1", "defect2"],
    mxVersionPhrases: ["mxVersion1", "mxVersion2"],
    currentVersion: "currentVersion",
    referenceVersion: "referenceVersion",
    returnBinaryRegressionsNotLinkedToAnyDefect: false,
  };
}

describe("BinaryRegressionTableStateService", () => {
  let service: BinaryRegressionTableStateService;
  let binaryRegressionDataService: BinaryRegressionDataService;

  beforeEach(() => {
    binaryRegressionDataService = {
      fetchAll: jest.fn(() => of(getFirstFetchBinaryRegressionResponse())),
    } as unknown as BinaryRegressionDataService;

    TestBed.configureTestingModule({
      providers: [
        BinaryRegressionTableStateService,
        BinaryRegressionDataService,
        {
          provide: BinaryRegressionDataService,
          useValue: binaryRegressionDataService,
        },
      ],
    });

    service = TestBed.inject(BinaryRegressionTableStateService);
    TestBed.tick();
    jest.clearAllMocks();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("initialization", () => {
    it("should initialize pageIndex to 0", () => {
      expect(service.page()).toEqual(0);
    });

    it("should initialize page size to 10", () => {
      expect(service.pageSize()).toEqual(10);
    });

    it("should initialize binary regressions request signal correctly", () => {
      expect(service["fetchBinaryRegressionsRequest"]()).toEqual(
        getDefaultFetchBinaryRegressionsRequest()
      );
    });

    it("should initialize getPageable() signal correctly", () => {
      expect(service["pageable"]()).toEqual(getDefaultPageable());
    });

    it("should compute binary regressions request signal from nested signals", () => {
      service["titlePhrases"].set(["title1", "title2"]);
      service["defectIdPhrases"].set(["defect1", "defect2"]);
      service["mxVersionPhrases"].set(["mxVersion1", "mxVersion2"]);
      service["fixPhrase"].set("fix");
      service["ownerPhrase"].set("owner");
      service["currentVersion"].set("currentVersion");
      service["referenceVersion"].set("referenceVersion");
      service["returnBinaryRegressionsNotLinkedToAnyDefect"].set(false);
      expect(service["fetchBinaryRegressionsRequest"]()).toStrictEqual(
        getFetchBinaryRegressionsRequest()
      );
    });

    it("should compute getPageable() signal from nested signals", () => {
      service["pageIndex"].set(1);
      service["size"].set(20);
      expect(service["pageable"]()).toStrictEqual(getPageable());
    });

    it("should compute binary regression page from fetch binary regressions response", fakeAsync(() => {
      expect(service.binaryRegressionsPage()).toEqual(
        getFirstBinaryRegressionPage()
      );

      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryRegressionResponse()));
      service["pageIndex"].set(1);
      tick();

      expect(service.binaryRegressionsPage()).toEqual(
        getSecondBinaryRegressionPage()
      );
    }));

    it("should compute binary regressions content from binary regressions page", fakeAsync(() => {
      expect(service.binaryRegressions()).toEqual([getFirstBinaryRegression()]);

      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryRegressionResponse()));
      service["pageIndex"].set(1);
      tick();

      expect(service.binaryRegressions()).toEqual([
        getSecondBinaryRegression(),
      ]);
    }));

    it("should compute total elements from binary regressions page", fakeAsync(() => {
      expect(service.totalElements()).toEqual(2);

      jest.spyOn(binaryRegressionDataService, "fetchAll").mockReturnValueOnce(
        of({
          binaryRegressions: {
            ...getSecondBinaryRegressionPage(),
            totalElements: 12,
          },
        })
      );
      service["pageIndex"].set(1);
      tick();

      expect(service.totalElements()).toEqual(12);
    }));

    it("should initialize error message signal correctly", () => {
      expect(service.errorMessage()).toBeUndefined();
    });

    it("should initialize isLoading signal correctly", () => {
      expect(service.isLoading()).toBeFalsy();
    });

    it("should initialize warning message signal correctly", () => {
      expect(service.warningMessage()).toBeUndefined();
    });

    it("should compute warning message from fetch defect result", fakeAsync(() => {
      expect(service.warningMessage()).toBeUndefined();

      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(of(getFetchBinaryRegressionResponseWithWarning()));
      service["pageIndex"].set(1);
      tick();
      expect(service.warningMessage()).toEqual(WARNING_MESSAGE);
    }));

    it("should initialize returnBinaryRegressionsNotLinkedToAnyDefect signal to false", () => {
      expect(
        service["returnBinaryRegressionsNotLinkedToAnyDefect"]()
      ).toBeFalsy();
    });
  });

  describe("refresh binary regressions", () => {
    it("refresh binary regression should be behavioural subject with false initial value", async () => {
      service["refresh$"].subscribe((refresh) => {
        expect(refresh).toBeFalsy();
      });
    });

    it("should emit a refresh event when refresh binary regressions is called", fakeAsync(() => {
      const refreshSpy = jest.spyOn(service["refresh$"], "next");
      service.refreshBinaryRegressions(true);
      tick();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not refresh after component is destroyed", fakeAsync(() => {
      service.ngOnDestroy();
      tick();
      service.refreshBinaryRegressions(true);
      tick();
      expect(binaryRegressionDataService.fetchAll).not.toHaveBeenCalled();
    }));
  });

  describe("ngOnDestroy", () => {
    it("should complete the destroy$ subject", () => {
      const destroySpy = jest.spyOn(service["destroy$"], "complete");
      service.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it("should emit a value on the destroy$ subject", () => {
      const destroySpy = jest.spyOn(service["destroy$"], "next");
      service.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalledWith({});
    });

    it("should not fetch binary regressions when the service is destroyed", fakeAsync(() => {
      service.ngOnDestroy();
      tick();
      service["pageIndex"].set(2);
      tick();
      expect(binaryRegressionDataService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should not fetch binary regressions when the service is destroyed and the fetch binary regressions request signal changes", fakeAsync(() => {
      service.ngOnDestroy();
      tick();
      service["fixPhrase"].set("fix2");
      tick();
      expect(binaryRegressionDataService.fetchAll).not.toHaveBeenCalled();
    }));
  });

  describe("setBinaryRegressionsTableQuery", () => {
    it("should set the page index", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setBinaryRegressionsTableQuery(getBinaryRegressionTableQuery());
      expect(signalSpy).toHaveBeenCalledWith(1);
    });

    it("should default the page index to 0 when not passed", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setBinaryRegressionsTableQuery({
        ...getBinaryRegressionTableQuery(),
        page: undefined,
      });
      expect(signalSpy).toHaveBeenCalledWith(0);
    });

    it("should set the page size", () => {
      const signalSpy = jest.spyOn(service["size"], "set");
      service.setBinaryRegressionsTableQuery(getBinaryRegressionTableQuery());
      expect(signalSpy).toHaveBeenCalledWith(20);
    });

    it("should default the page size to 10 when not passed", () => {
      const signalSpy = jest.spyOn(service["size"], "set");
      service.setBinaryRegressionsTableQuery({
        ...getBinaryRegressionTableQuery(),
        pageSize: undefined,
      });
      expect(signalSpy).toHaveBeenCalledWith(10);
    });

    it.each([
      [
        getBinaryRegressionTableQuery(),
        getBinaryRegressionTableQuery().titlePhrases,
      ],
      [
        { ...getBinaryRegressionTableQuery(), titlePhrases: undefined },
        undefined,
      ],
    ])("should set the title phrases", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["titlePhrases"], "set");
      service.setBinaryRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getBinaryRegressionTableQuery(),
        getBinaryRegressionTableQuery().defectIdPhrases,
      ],
      [
        { ...getBinaryRegressionTableQuery(), defectIdPhrases: undefined },
        undefined,
      ],
    ])("should set the defect id phrases", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["defectIdPhrases"], "set");
      service.setBinaryRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getBinaryRegressionTableQuery(),
        getBinaryRegressionTableQuery().mxVersionPhrases,
      ],
      [
        { ...getBinaryRegressionTableQuery(), mxVersionPhrases: undefined },
        undefined,
      ],
    ])("should set the mxVersion phrases", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["mxVersionPhrases"], "set");
      service.setBinaryRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getBinaryRegressionTableQuery(),
        getBinaryRegressionTableQuery().fixPhrase,
      ],
      [{ ...getBinaryRegressionTableQuery(), fixPhrase: undefined }, undefined],
    ])("should set the fix phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["fixPhrase"], "set");
      service.setBinaryRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getBinaryRegressionTableQuery(),
        getBinaryRegressionTableQuery().ownerPhrase,
      ],
      [
        { ...getBinaryRegressionTableQuery(), ownerPhrase: undefined },
        undefined,
      ],
    ])("should set the owner phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["ownerPhrase"], "set");
      service.setBinaryRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });
  });

  describe("setValidationScope", () => {
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

    it("should reset the page index", () => {
      service.setBinaryRegressionsTableQuery({
        page: 2,
      } as BinaryRegressionTableQuery);
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setValidationScope(getValidationScope());
      expect(signalSpy).toHaveBeenCalledWith(0);
    });
  });

  describe("showBinaryRegressionsWithoutDefects", () => {
    it.each([true, false])(
      "should set the returnBinaryRegressionsNotLinkedToAnyDefect signal",
      (criteria) => {
        const signalSpy = jest.spyOn(
          service["returnBinaryRegressionsNotLinkedToAnyDefect"],
          "set"
        );
        service.showBinaryRegressionsWithoutDefects(criteria);
        expect(signalSpy).toHaveBeenCalledWith(criteria);
      }
    );
  });

  describe("fetch binary regressions page", () => {
    it("should fetch binary regressions page with all query fields correctly", fakeAsync(() => {
      service["pageIndex"].set(1);
      service["size"].set(20);
      service["titlePhrases"].set(["title1", "title2"]);
      service["defectIdPhrases"].set(["defect1", "defect2"]);
      service["mxVersionPhrases"].set(["mxVersion1", "mxVersion2"]);
      service["fixPhrase"].set("fix");
      service["ownerPhrase"].set("owner");
      service["currentVersion"].set("currentVersion");
      service["referenceVersion"].set("referenceVersion");
      service["returnBinaryRegressionsNotLinkedToAnyDefect"].set(false);
      tick();
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledWith(
        getPageable(),
        getFetchBinaryRegressionsRequest()
      );
    }));

    it("should fetch binary regressions page again when refresh$ emits a new value", fakeAsync(() => {
      expect(service["refresh$"].value).toBeFalsy();
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(of(getFirstFetchBinaryRegressionResponse()));
      service.refreshBinaryRegressions(true);
      tick();
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledTimes(1);
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledWith(
        getDefaultPageable(),
        getDefaultFetchBinaryRegressionsRequest()
      );
      expect(service["refresh$"].value).toBeTruthy();
    }));

    it("should fetch the binary regressions page again when page index changes", fakeAsync(() => {
      expect(service["pageable"]().page).toEqual(0);
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryRegressionResponse()));
      service["pageIndex"].set(1);
      tick();
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledTimes(1);
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledWith(
        {
          ...getDefaultPageable(),
          page: 1,
        },
        getDefaultFetchBinaryRegressionsRequest()
      );
    }));

    it("should fetch the binary regressions page again when page size changes", fakeAsync(() => {
      expect(service["pageable"]().size).toEqual(10);
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryRegressionResponse()));
      service["size"].set(20);
      tick();
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledTimes(1);
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledWith(
        {
          ...getDefaultPageable(),
          size: 20,
        },
        getDefaultFetchBinaryRegressionsRequest()
      );
    }));

    it("should not fetch the binary regressions page again if the page index is set to the same value", fakeAsync(() => {
      expect(service["pageable"]().page).toEqual(0);
      service["pageIndex"].set(0);
      tick();
      expect(binaryRegressionDataService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should not fetch the binary regressions page again if the page size is set to the same value", fakeAsync(() => {
      expect(service["pageable"]().size).toEqual(10);
      service["size"].set(10);
      tick();
      expect(binaryRegressionDataService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should set isLoading to true when fetching binary regressions", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service["_isLoading"], "set");
      service["pageIndex"].set(1);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set isLoading to false when fetching binary regressions failed", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service["_isLoading"], "set");
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));

    it("should default result to an empty page when there is a failure while fetching binary regressions", fakeAsync(() => {
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(service.fetchBinaryRegressionResponse()).toEqual(getEmptyResult());
      expect(service.binaryRegressions()).toEqual([]);
    }));

    it("should set error message signal on failure to fetch binary regressions", fakeAsync(() => {
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(service.errorMessage()).toEqual("failure");
    }));

    it("should reinitialize the list of binary regressions on failure to fetch binary regressions", fakeAsync(() => {
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchBinaryRegressionResponse()));
      service["pageIndex"].set(1);
      tick();
      expect(service.binaryRegressions()).toEqual([
        getSecondBinaryRegression(),
      ]);
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(2);
      tick();
      expect(service.binaryRegressions()).toEqual([]);
    }));

    it("should set the warning message to undefined before fetching binary regressions", fakeAsync(() => {
      const warningMessageSpy = jest.spyOn(service["_warningMessage"], "set");
      service["pageIndex"].set(1);
      tick();
      expect(warningMessageSpy).toHaveBeenCalledWith(undefined);
    }));

    it("should set the warning message from the fetch binary regressions response", fakeAsync(() => {
      const warningMessageSpy = jest.spyOn(service["_warningMessage"], "set");
      jest
        .spyOn(binaryRegressionDataService, "fetchAll")
        .mockReturnValueOnce(of(getFetchBinaryRegressionResponseWithWarning()));
      service["pageIndex"].set(1);
      tick();
      expect(warningMessageSpy).toHaveBeenCalledWith(WARNING_MESSAGE);
    }));

    it("should fetch binary regressions page again when the return binary regressions not linked to any defect signal changes", fakeAsync(() => {
      tick();
      jest.spyOn(binaryRegressionDataService, "fetchAll");
      expect(
        service["returnBinaryRegressionsNotLinkedToAnyDefect"]()
      ).toBeFalsy();
      service.showBinaryRegressionsWithoutDefects(true);
      tick();
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledTimes(1);
      expect(binaryRegressionDataService.fetchAll).toHaveBeenCalledWith(
        getDefaultPageable(),
        {
          ...getDefaultFetchBinaryRegressionsRequest(),
          returnBinaryRegressionsNotLinkedToAnyDefect: true,
        }
      );
    }));
  });
});
