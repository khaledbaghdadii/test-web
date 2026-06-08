import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { ConfigurationImpactTableStateService } from "./configuration-impact-table-state.service";
import { delay, of, throwError } from "rxjs";
import { Store } from "@ngrx/store";
import {
  ConfigurationImpactService,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import {
  ConfigurationImpactsPage,
  FetchConfigurationImpactsResponse,
} from "../model/fetch-configuration-impacts-response";
import { ConfigurationImpactTableQuery } from "./configuration-impact-table-query.model";
import { FetchConfigurationImpactsRequest } from "../model/fetch-configuration-impacts-request";

const PROJECT_ID = "project_id";

function getEmptyResult(): FetchConfigurationImpactsResponse {
  return {
    configurationImpacts: {
      content: [],
      totalElements: 0,
    },
  };
}

function getFirstConfigurationImpact(): LiteConfigurationImpact {
  return {
    id: "1",
    projectId: PROJECT_ID,
    title: "title1",
    guiltyChange: "guiltyChange1",
    owner: "owner1",
  };
}

function getSecondConfigurationImpact(): LiteConfigurationImpact {
  return {
    id: "2",
    projectId: PROJECT_ID,
    title: "title2",
    guiltyChange: "guiltyChange2",
    owner: "owner2",
  };
}

function getFirstConfigurationImpactPage(): ConfigurationImpactsPage {
  return {
    content: [getFirstConfigurationImpact()],
    totalElements: 2,
  };
}

function getSecondConfigurationImpactPage(): ConfigurationImpactsPage {
  return {
    content: [getSecondConfigurationImpact()],
    totalElements: 2,
  };
}

function getFirstFetchConfigurationImpactsResponse(): FetchConfigurationImpactsResponse {
  return {
    configurationImpacts: getFirstConfigurationImpactPage(),
  };
}

function getSecondFetchConfigurationImpactResponse(): FetchConfigurationImpactsResponse {
  return {
    configurationImpacts: getSecondConfigurationImpactPage(),
  };
}

function getConfigurationImpactTableQuery(): ConfigurationImpactTableQuery {
  return {
    page: 1,
    pageSize: 20,
    ownerPhrase: "owner",
    titlePhrase: "title",
    guiltyChangePhrase: "guiltyChange",
  } as ConfigurationImpactTableQuery;
}

function getDefaultFetchConfigurationImpactsRequest(): FetchConfigurationImpactsRequest {
  return {
    page: 0,
    size: 10,
    ids: undefined,
    ownerPhrase: undefined,
    titlePhrase: undefined,
    guiltyChangePhrase: undefined,
  };
}

function getFetchConfigurationImpactsRequest(): FetchConfigurationImpactsRequest {
  return {
    page: 1,
    size: 20,
    ownerPhrase: "owner",
    titlePhrase: "title",
    guiltyChangePhrase: "guiltyChange",
  };
}

describe("ConfigurationImpactTableStateService", () => {
  let store: Store;
  let service: ConfigurationImpactTableStateService;
  let configurationImpactService: ConfigurationImpactService;

  beforeEach(() => {
    store = {
      select: jest.fn(() => of(PROJECT_ID)),
    } as unknown as Store;

    configurationImpactService = {
      fetchAll: jest.fn(() => of(getFirstFetchConfigurationImpactsResponse())),
    } as unknown as ConfigurationImpactService;

    TestBed.configureTestingModule({
      providers: [
        ConfigurationImpactTableStateService,
        ConfigurationImpactService,
        {
          provide: ConfigurationImpactService,
          useValue: configurationImpactService,
        },
        { provide: Store, useValue: store },
      ],
    });

    service = TestBed.inject(ConfigurationImpactTableStateService);
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
          ConfigurationImpactTableStateService,
          {
            provide: ConfigurationImpactService,
            useValue: configurationImpactService,
          },
          {
            provide: Store,
            useValue: {
              select: jest.fn(() => of(PROJECT_ID).pipe(delay(1000))),
            },
          },
        ],
      });
      const localService = TestBed.inject(ConfigurationImpactTableStateService);
      expect(localService.projectId()).toEqual("");
      tick(2000);
      expect(localService.projectId()).toEqual(PROJECT_ID);
    }));

    it("should fetch the projectId form the store correctly", () => {
      const storeSpy = jest.spyOn(store, "select");
      expect(storeSpy).toHaveBeenCalled();
      expect(service.projectId()).toEqual(PROJECT_ID);
    });

    it("should initialize configuration impacts request signal correctly", () => {
      expect(service["fetchConfigurationImpactsRequest"]()).toEqual(
        getDefaultFetchConfigurationImpactsRequest()
      );
    });

    it("should compute configuration impacts request signal from nested signals", () => {
      service.setConfigurationImpactsTableQuery({
        page: 1,
        pageSize: 20,
        titlePhrase: "title",
        guiltyChangePhrase: "guiltyChange",
        ownerPhrase: "owner",
      });
      expect(service["fetchConfigurationImpactsRequest"]()).toStrictEqual(
        getFetchConfigurationImpactsRequest()
      );
    });

    it("should compute configuration impacts content from configuration impacts page", fakeAsync(() => {
      expect(service.configurationImpacts()).toEqual([
        getFirstConfigurationImpact(),
      ]);

      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchConfigurationImpactResponse()));
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: 1,
      });
      tick();

      expect(service.configurationImpacts()).toEqual([
        getSecondConfigurationImpact(),
      ]);
    }));

    it("should compute total elements from configuration impacts page", fakeAsync(() => {
      expect(service.totalElements()).toEqual(2);

      jest.spyOn(configurationImpactService, "fetchAll").mockReturnValueOnce(
        of({
          configurationImpacts: {
            ...getSecondConfigurationImpactPage(),
            totalElements: 12,
          },
        })
      );
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: 1,
      });
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

  describe("refresh configuration impacts", () => {
    it("refresh configuration impact should be behavioural subject with false initial value", async () => {
      service["refresh$"].subscribe((refresh) => {
        expect(refresh).toBeFalsy();
      });
    });

    it("should emit a refresh event when refresh configuration impacts is called", fakeAsync(() => {
      const refreshSpy = jest.spyOn(service["refresh$"], "next");
      service.refreshConfigurationImpacts(true);
      tick();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not refresh after component is destroyed", fakeAsync(() => {
      jest.clearAllMocks();
      service.ngOnDestroy();
      tick();
      service.refreshConfigurationImpacts(true);
      tick();
      expect(configurationImpactService.fetchAll).not.toHaveBeenCalled();
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

    it("should not fetch configuration impacts when the service is destroyed", fakeAsync(() => {
      jest.clearAllMocks();
      service.ngOnDestroy();
      tick();
      service["pageIndex"].set(2);
      tick();
      expect(configurationImpactService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should not fetch configuration impacts when the service is destroyed and the fetch configuration impacts request signal changes", fakeAsync(() => {
      jest.clearAllMocks();
      service.ngOnDestroy();
      tick();
      service["titlePhrase"].set("new title phrase");
      tick();
      expect(configurationImpactService.fetchAll).not.toHaveBeenCalled();
    }));
  });

  describe("setConfigurationImpactssTableQuery", () => {
    it("should set the page index", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setConfigurationImpactsTableQuery(
        getConfigurationImpactTableQuery()
      );
      expect(signalSpy).toHaveBeenCalledWith(1);
    });

    it("should default the page index to 0 when not passed", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: undefined,
      });
      expect(signalSpy).toHaveBeenCalledWith(0);
    });

    it("should set the page size", () => {
      const signalSpy = jest.spyOn(service["pageSize"], "set");
      service.setConfigurationImpactsTableQuery(
        getConfigurationImpactTableQuery()
      );
      expect(signalSpy).toHaveBeenCalledWith(20);
    });

    it("should default the page size to 10 when not passed", () => {
      const signalSpy = jest.spyOn(service["pageSize"], "set");
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        pageSize: undefined,
      });
      expect(signalSpy).toHaveBeenCalledWith(10);
    });

    it.each([
      [
        getConfigurationImpactTableQuery(),
        getConfigurationImpactTableQuery().titlePhrase,
      ],
      [
        { ...getConfigurationImpactTableQuery(), titlePhrase: undefined },
        undefined,
      ],
      [
        {
          ...getConfigurationImpactTableQuery(),
          titlePhrase: "    ",
        },
        "    ",
      ],
    ])("should set the title phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["titlePhrase"], "set");
      service.setConfigurationImpactsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getConfigurationImpactTableQuery(),
        getConfigurationImpactTableQuery().ownerPhrase,
      ],
      [
        { ...getConfigurationImpactTableQuery(), ownerPhrase: undefined },
        undefined,
      ],
      [{ ...getConfigurationImpactTableQuery(), ownerPhrase: "   " }, "   "],
    ])("should set the owner phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["ownerPhrase"], "set");
      service.setConfigurationImpactsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [
        getConfigurationImpactTableQuery(),
        getConfigurationImpactTableQuery().guiltyChangePhrase,
      ],
      [
        {
          ...getConfigurationImpactTableQuery(),
          guiltyChangePhrase: undefined,
        },
        undefined,
      ],
      [
        {
          ...getConfigurationImpactTableQuery(),
          guiltyChangePhrase: "    ",
        },
        "    ",
      ],
    ])("should set the guilty change phrase", (query, expectedPhrases) => {
      const signalSpy = jest.spyOn(service["guiltyChangePhrase"], "set");
      service.setConfigurationImpactsTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrases);
    });
  });

  describe("fetch configuration impacts page", () => {
    it("should fetch configuration impacts page with all query fields correctly", fakeAsync(() => {
      service.setConfigurationImpactsTableQuery({
        page: 1,
        pageSize: 20,
        titlePhrase: "title",
        guiltyChangePhrase: "guiltyChange",
        ownerPhrase: "owner",
      });
      tick();
      expect(configurationImpactService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        getFetchConfigurationImpactsRequest()
      );
    }));

    it("should fetch configuration impacts page again when refresh$ emits a new value", fakeAsync(() => {
      jest.clearAllMocks();
      expect(service["refresh$"].value).toBeFalsy();
      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(of(getFirstFetchConfigurationImpactsResponse()));
      service.refreshConfigurationImpacts(true);
      tick();
      expect(configurationImpactService.fetchAll).toHaveBeenCalledTimes(1);
      expect(configurationImpactService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        getDefaultFetchConfigurationImpactsRequest()
      );
      expect(service["refresh$"].value).toBeTruthy();
    }));

    it("should fetch the configuration impacts page again when page index changes", fakeAsync(() => {
      jest.clearAllMocks();
      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchConfigurationImpactResponse()));
      service.setConfigurationImpactsTableQuery({
        page: 1,
      });
      tick();
      expect(configurationImpactService.fetchAll).toHaveBeenCalledTimes(1);
      expect(configurationImpactService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        {
          ...getDefaultFetchConfigurationImpactsRequest(),
          page: 1,
        }
      );
    }));

    it("should fetch the configuration impacts page again when page size changes", fakeAsync(() => {
      jest.clearAllMocks();
      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchConfigurationImpactResponse()));
      service.setConfigurationImpactsTableQuery({
        pageSize: 20,
      });
      tick();
      expect(configurationImpactService.fetchAll).toHaveBeenCalledTimes(1);
      expect(configurationImpactService.fetchAll).toHaveBeenCalledWith(
        PROJECT_ID,
        {
          ...getDefaultFetchConfigurationImpactsRequest(),
          size: 20,
        }
      );
    }));

    it("should not fetch the configuration impacts page again if the page index is set to the same value", fakeAsync(() => {
      jest.clearAllMocks();
      service.setConfigurationImpactsTableQuery({
        page: 0,
      });
      tick();
      expect(configurationImpactService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should not fetch the configuration impacts page again if the page size is set to the same value", fakeAsync(() => {
      jest.clearAllMocks();
      service.setConfigurationImpactsTableQuery({
        pageSize: 10,
      });
      tick();
      expect(configurationImpactService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should set isLoading to true when fetching configuration impacts", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service["_isLoading"], "set");
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: 1,
      });
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set isLoading to false when fetching configuration impacts failed", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service["_isLoading"], "set");
      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: 1,
      });
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));

    it("should default result to an empty page when there is a failure while fetching configuration impacts", fakeAsync(() => {
      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: 1,
      });
      tick();
      expect(service.fetchConfigurationImpactsResponse()).toEqual(
        getEmptyResult()
      );
      expect(service.configurationImpacts()).toEqual([]);
    }));

    it("should set error message signal on failure to fetch configuration impacts", fakeAsync(() => {
      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: 1,
      });
      tick();
      expect(service.errorMessage()).toEqual("failure");
    }));

    it("should reinitialize the list of configuration impacts on failure to fetch configuration impacts", fakeAsync(() => {
      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(of(getSecondFetchConfigurationImpactResponse()));
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: 1,
      });
      tick();
      expect(service.configurationImpacts()).toEqual([
        getSecondConfigurationImpact(),
      ]);
      jest
        .spyOn(configurationImpactService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service.setConfigurationImpactsTableQuery({
        ...getConfigurationImpactTableQuery(),
        page: 2,
      });
      tick();
      expect(service.configurationImpacts()).toEqual([]);
    }));
  });
});
