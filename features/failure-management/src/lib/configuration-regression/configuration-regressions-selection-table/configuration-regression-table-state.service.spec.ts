import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { ConfigurationRegressionTableStateService } from "./configuration-regression-table-state.service";
import { delay, of, throwError } from "rxjs";
import { ConfigurationRegressionTableQuery } from "./configuration-regression-table-query.model";
import { Store } from "@ngrx/store";
import {
  ConfigurationRegressionService,
  ConfigurationRegressionsPage,
  FetchConfigurationRegressionsRequest,
  FetchConfigurationRegressionsResponse,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";

const PROJECT_ID = "project_id";

function getEmptyResult(): FetchConfigurationRegressionsResponse {
  return {
    configurationRegressions: {
      content: [],
      totalElements: 0,
    },
  };
}

function getFirstConfigurationRegression(): LiteConfigurationRegression {
  return {
    id: "1",
    projectId: PROJECT_ID,
    title: "title1",
    guiltyChange: "guiltyChange1",
    owner: "owner1",
    fix: "fix1",
  };
}

function getSecondConfigurationRegression(): LiteConfigurationRegression {
  return {
    id: "2",
    projectId: PROJECT_ID,
    title: "title2",
    guiltyChange: "guiltyChange2",
    owner: "owner2",
    fix: "fix2",
  };
}

function getFirstConfigurationRegressionPage(): ConfigurationRegressionsPage {
  return {
    content: [getFirstConfigurationRegression()],
    totalElements: 2,
  };
}

function getSecondConfigurationRegressionPage(): ConfigurationRegressionsPage {
  return {
    content: [getSecondConfigurationRegression()],
    totalElements: 2,
  };
}

function getFirstFetchConfigurationRegressionResponse(): FetchConfigurationRegressionsResponse {
  return {
    configurationRegressions: getFirstConfigurationRegressionPage(),
  };
}

function getSecondFetchConfigurationRegressionResponse(): FetchConfigurationRegressionsResponse {
  return {
    configurationRegressions: getSecondConfigurationRegressionPage(),
  };
}

function getConfigurationRegressionTableQuery(): ConfigurationRegressionTableQuery {
  return {
    page: 1,
    pageSize: 20,
    fixPhrase: "fix",
    ownerPhrase: "owner",
    titlePhrases: ["title1", "title2"],
    guiltyChangePhrases: ["guiltyChange1", "guiltyChange2"],
  } as ConfigurationRegressionTableQuery;
}

function getDefaultFetchConfigurationRegressionsRequest(): FetchConfigurationRegressionsRequest {
  return {
    page: 0,
    size: 10,
    ids: undefined,
    ownerPhrase: undefined,
    fixPhrase: undefined,
    titlePhrases: undefined,
    guiltyChangePhrases: undefined,
  };
}

function getFetchConfigurationRegressionsRequest(): FetchConfigurationRegressionsRequest {
  return {
    page: 1,
    size: 20,
    ownerPhrase: "owner",
    fixPhrase: "fix",
    titlePhrases: ["title1", "title2"],
    guiltyChangePhrases: ["guiltyChange1", "guiltyChange2"],
  };
}

describe("ConfigurationRegressionTableStateService", () => {
  let store: Store;
  let service: ConfigurationRegressionTableStateService;
  let configurationRegressionService: ConfigurationRegressionService;

  beforeEach(() => {
    store = {
      select: jest.fn(() => of(PROJECT_ID)),
    } as unknown as Store;

    configurationRegressionService = {
      fetchAll: jest.fn(() =>
        of(getFirstFetchConfigurationRegressionResponse())
      ),
    } as unknown as ConfigurationRegressionService;

    TestBed.configureTestingModule({
      providers: [
        ConfigurationRegressionTableStateService,
        ConfigurationRegressionService,
        {
          provide: ConfigurationRegressionService,
          useValue: configurationRegressionService,
        },
        { provide: Store, useValue: store },
      ],
    });

    service = TestBed.inject(ConfigurationRegressionTableStateService);
    TestBed.tick();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("initialization", () => {
    it("should initialize the project id to the default value of empty string", fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ConfigurationRegressionTableStateService,
          {
            provide: ConfigurationRegressionService,
            useValue: configurationRegressionService,
          },
          {
            provide: Store,
            useValue: {
              select: jest.fn(() => of(PROJECT_ID).pipe(delay(1000))),
            },
          },
        ],
      });
      const localService = TestBed.inject(
        ConfigurationRegressionTableStateService
      );
      expect(localService.projectId()).toEqual("");
      tick(2000);
      expect(localService.projectId()).toEqual(PROJECT_ID);
    }));

    it("should fetch the projectId form the store correctly", () => {
      const storeSpy = jest.spyOn(store, "select");
      expect(storeSpy).toHaveBeenCalled();
      expect(service.projectId()).toEqual(PROJECT_ID);
    });

    it("should initialize configuration regressions request signal correctly", () => {
      expect(service["fetchConfigurationRegressionsRequest"]()).toEqual(
        getDefaultFetchConfigurationRegressionsRequest()
      );
    });

    it("should compute configuration regressions request signal from nested signals", () => {
      service["pageIndex"].set(1);
      service["pageSize"].set(20);
      service["titlePhrases"].set(["title1", "title2"]);
      service["fixPhrase"].set("fix");
      service["ownerPhrase"].set("owner");
      service["guiltyChangePhrases"].set(["guiltyChange1", "guiltyChange2"]);
      expect(service["fetchConfigurationRegressionsRequest"]()).toStrictEqual(
        getFetchConfigurationRegressionsRequest()
      );
    });

    it("should compute configuration regressions page from fetch configuration regressions response", fakeAsync(() => {
      expect(service["configurationRegressionsPage"]()).toEqual(
        getFirstConfigurationRegressionPage()
      );

      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(
          of(getSecondFetchConfigurationRegressionResponse())
        );
      service["pageIndex"].set(1);
      tick();

      expect(service["configurationRegressionsPage"]()).toEqual(
        getSecondConfigurationRegressionPage()
      );
    }));

    it("should compute configuration regressions content from configuration regressions page", fakeAsync(() => {
      expect(service.configurationRegressions()).toEqual([
        getFirstConfigurationRegression(),
      ]);

      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(
          of(getSecondFetchConfigurationRegressionResponse())
        );
      service["pageIndex"].set(1);
      tick();

      expect(service.configurationRegressions()).toEqual([
        getSecondConfigurationRegression(),
      ]);
    }));

    it("should compute total elements from configuration regressions page", fakeAsync(() => {
      expect(service.totalElements()).toEqual(2);

      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(
          of({
            configurationRegressions: {
              ...getSecondConfigurationRegressionPage(),
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
  });

  describe("refresh configuration regressions", () => {
    it("refresh configuration regression should be behavioural subject with false initial value", async () => {
      service["refresh$"].subscribe((refresh) => {
        expect(refresh).toBeFalsy();
      });
    });

    it("should emit a refresh event when refresh configuration regressions is called", fakeAsync(() => {
      const refreshSpy = jest.spyOn(service["refresh$"], "next");
      service.refreshConfigurationRegressions(true);
      tick();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not refresh after component is destroyed", fakeAsync(() => {
      jest.clearAllMocks();
      service.ngOnDestroy();
      tick();
      service.refreshConfigurationRegressions(true);
      tick();
      expect(configurationRegressionService.fetchAll).not.toHaveBeenCalled();
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

    it("should not fetch configuration regressions when the service is destroyed", fakeAsync(() => {
      jest.clearAllMocks();
      service.ngOnDestroy();
      tick();
      service["pageIndex"].set(2);
      tick();
      expect(configurationRegressionService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should not fetch configuration regressions when the service is destroyed and the fetch configuration regressions request signal changes", fakeAsync(() => {
      jest.clearAllMocks();
      service.ngOnDestroy();
      tick();
      service["fixPhrase"].set("fix2");
      tick();
      expect(configurationRegressionService.fetchAll).not.toHaveBeenCalled();
    }));
  });

  describe("setConfigurationRegressionsTableQuery", () => {
    it("should set the page index", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setConfigurationRegressionsTableQuery(
        getConfigurationRegressionTableQuery()
      );
      expect(signalSpy).toHaveBeenCalledWith(1);
    });

    it("should default the page index to 0 when not passed", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setConfigurationRegressionsTableQuery({
        ...getConfigurationRegressionTableQuery(),
        page: undefined,
      });
      expect(signalSpy).toHaveBeenCalledWith(0);
    });

    it("should set the page size", () => {
      const signalSpy = jest.spyOn(service["pageSize"], "set");
      service.setConfigurationRegressionsTableQuery(
        getConfigurationRegressionTableQuery()
      );
      expect(signalSpy).toHaveBeenCalledWith(20);
    });

    it("should default the page size to 10 when not passed", () => {
      const signalSpy = jest.spyOn(service["pageSize"], "set");
      service.setConfigurationRegressionsTableQuery({
        ...getConfigurationRegressionTableQuery(),
        pageSize: undefined,
      });
      expect(signalSpy).toHaveBeenCalledWith(10);
    });

    it.each([
      [
        getConfigurationRegressionTableQuery(),
        getConfigurationRegressionTableQuery().titlePhrases,
      ],
      [
        { ...getConfigurationRegressionTableQuery(), titlePhrases: undefined },
        undefined,
      ],
      [
        {
          ...getConfigurationRegressionTableQuery(),
          titlePhrases: ["", "    ", undefined as unknown as string],
        },
        undefined,
      ],
    ])("should set the title phrases", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["titlePhrases"], "set");
      service.setConfigurationRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getConfigurationRegressionTableQuery(),
        getConfigurationRegressionTableQuery().fixPhrase,
      ],
      [
        { ...getConfigurationRegressionTableQuery(), fixPhrase: undefined },
        undefined,
      ],
      [
        { ...getConfigurationRegressionTableQuery(), fixPhrase: "   " },
        undefined,
      ],
    ])("should set the fix phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["fixPhrase"], "set");
      service.setConfigurationRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getConfigurationRegressionTableQuery(),
        getConfigurationRegressionTableQuery().ownerPhrase,
      ],
      [
        { ...getConfigurationRegressionTableQuery(), ownerPhrase: undefined },
        undefined,
      ],
      [
        { ...getConfigurationRegressionTableQuery(), ownerPhrase: "   " },
        undefined,
      ],
    ])("should set the owner phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["ownerPhrase"], "set");
      service.setConfigurationRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getConfigurationRegressionTableQuery(),
        getConfigurationRegressionTableQuery().guiltyChangePhrases,
      ],
      [
        {
          ...getConfigurationRegressionTableQuery(),
          guiltyChangePhrases: undefined,
        },
        undefined,
      ],
      [
        {
          ...getConfigurationRegressionTableQuery(),
          guiltyChangePhrases: ["", "    ", undefined as unknown as string],
        },
        undefined,
      ],
    ])("should set the guilty change phrases", (query, expectedPhrases) => {
      const signalSpy = jest.spyOn(service["guiltyChangePhrases"], "set");
      service.setConfigurationRegressionsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrases);
    });
  });

  describe("fetch configuration regressions page", () => {
    it("should fetch configuration regressions page with all query fields correctly", fakeAsync(() => {
      service["pageIndex"].set(1);
      service["pageSize"].set(20);
      service["titlePhrases"].set(["title1", "title2"]);
      service["guiltyChangePhrases"].set(["guiltyChange1", "guiltyChange2"]);
      service["fixPhrase"].set("fix");
      service["ownerPhrase"].set("owner");
      tick();
      expect(configurationRegressionService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        getFetchConfigurationRegressionsRequest()
      );
    }));

    it("should fetch configuration regressions page again when refresh$ emits a new value", fakeAsync(() => {
      jest.clearAllMocks();
      expect(service["refresh$"].value).toBeFalsy();
      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(
          of(getFirstFetchConfigurationRegressionResponse())
        );
      service.refreshConfigurationRegressions(true);
      tick();
      expect(configurationRegressionService.fetchAll).toHaveBeenCalledTimes(1);
      expect(configurationRegressionService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        getDefaultFetchConfigurationRegressionsRequest()
      );
      expect(service["refresh$"].value).toBeTruthy();
    }));

    it("should fetch the configuration regressions page again when page index changes", fakeAsync(() => {
      jest.clearAllMocks();
      expect(service["fetchConfigurationRegressionsRequest"]().page).toEqual(0);
      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(
          of(getSecondFetchConfigurationRegressionResponse())
        );
      service["pageIndex"].set(1);
      tick();
      expect(configurationRegressionService.fetchAll).toHaveBeenCalledTimes(1);
      expect(configurationRegressionService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        {
          ...getDefaultFetchConfigurationRegressionsRequest(),
          page: 1,
        }
      );
    }));

    it("should fetch the configuration regressions page again when page size changes", fakeAsync(() => {
      jest.clearAllMocks();
      expect(service["fetchConfigurationRegressionsRequest"]().size).toEqual(
        10
      );
      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(
          of(getSecondFetchConfigurationRegressionResponse())
        );
      service["pageSize"].set(20);
      tick();
      expect(configurationRegressionService.fetchAll).toHaveBeenCalledTimes(1);
      expect(configurationRegressionService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        {
          ...getDefaultFetchConfigurationRegressionsRequest(),
          size: 20,
        }
      );
    }));

    it("should not fetch the configuration regressions page again if the page index is set to the same value", fakeAsync(() => {
      jest.clearAllMocks();
      expect(service["fetchConfigurationRegressionsRequest"]().page).toEqual(0);
      service["pageIndex"].set(0);
      tick();
      expect(configurationRegressionService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should not fetch the configuration regressions page again if the page size is set to the same value", fakeAsync(() => {
      jest.clearAllMocks();
      expect(service["fetchConfigurationRegressionsRequest"]().size).toEqual(
        10
      );
      service["pageSize"].set(10);
      tick();
      expect(configurationRegressionService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should set isLoading to true when fetching configuration regressions", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service["_isLoading"], "set");
      service["pageIndex"].set(1);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set isLoading to false when fetching configuration regressions failed", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service["_isLoading"], "set");
      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));

    it("should default result to an empty page when there is a failure while fetching configuration regressions", fakeAsync(() => {
      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(service.fetchConfigurationRegressionsResponse()).toEqual(
        getEmptyResult()
      );
      expect(service.configurationRegressions()).toEqual([]);
    }));

    it("should set error message signal on failure to fetch configuration regressions", fakeAsync(() => {
      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      expect(service.errorMessage()).toEqual("failure");
    }));

    it("should reinitialize the list of configuration regressions on failure to fetch configuration regressions", fakeAsync(() => {
      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(
          of(getSecondFetchConfigurationRegressionResponse())
        );
      service["pageIndex"].set(1);
      tick();
      expect(service.configurationRegressions()).toEqual([
        getSecondConfigurationRegression(),
      ]);
      jest
        .spyOn(configurationRegressionService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(2);
      tick();
      expect(service.configurationRegressions()).toEqual([]);
    }));
  });
});
