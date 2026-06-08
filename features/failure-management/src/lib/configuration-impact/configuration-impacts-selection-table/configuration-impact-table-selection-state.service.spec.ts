import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { delay, of, throwError } from "rxjs";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
} from "@mxflow/features/analysis-objects";
import { ConfigurationImpactTableSelectionStateService } from "./configuration-impact-table-selection-state.service";
import {
  ConfigurationImpactService,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import { Store } from "@ngrx/store";

const PROJECT_ID = "project_id";

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

function getFullySelectedConfigurationImpact(
  ConfigurationImpact: LiteConfigurationImpact
): AnalysisObjectSelectionState<AnalysisObject> {
  return {
    analysisObject: ConfigurationImpact,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

describe("ConfigurationImpactTableSelectionStateService", () => {
  let store: Store;
  let service: ConfigurationImpactTableSelectionStateService;
  let configurationImpactService: ConfigurationImpactService;

  beforeEach(() => {
    store = {
      select: jest.fn(() => of(PROJECT_ID)),
    } as unknown as Store;

    configurationImpactService = {
      fetchByIds: jest.fn(() =>
        of([getFirstConfigurationImpact(), getSecondConfigurationImpact()])
      ),
    } as unknown as ConfigurationImpactService;

    TestBed.configureTestingModule({
      providers: [
        ConfigurationImpactTableSelectionStateService,
        ConfigurationImpactService,
        {
          provide: ConfigurationImpactService,
          useValue: configurationImpactService,
        },
        { provide: Store, useValue: store },
      ],
    });

    service = TestBed.inject(ConfigurationImpactTableSelectionStateService);
    TestBed.tick();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("initialization", () => {
    it("should fetch the projectId from the store correctly", () => {
      const storeSpy = jest.spyOn(store, "select");
      expect(storeSpy).toHaveBeenCalled();
      expect(service.projectId()).toEqual(PROJECT_ID);
    });

    it("should initialize the project id to the default value of empty string", fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ConfigurationImpactTableSelectionStateService,
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
      const localService = TestBed.inject(
        ConfigurationImpactTableSelectionStateService
      );
      expect(localService.projectId()).toEqual("");
      tick(2000);
      expect(localService.projectId()).toEqual(PROJECT_ID);
    }));

    it("should compute configuration impact initially selection states from fetch Configuration impacts by ids response", fakeAsync(() => {
      jest
        .spyOn(configurationImpactService, "fetchByIds")
        .mockReturnValue(of([getSecondConfigurationImpact()]));
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),

        getFullySelectedConfigurationImpact(getSecondConfigurationImpact()),
      ]);
      tick();

      expect(service.initiallyConfigurationImpactSelectionStates()).toEqual([
        getFullySelectedConfigurationImpact(getSecondConfigurationImpact()),
      ]);
    }));

    it("should initialize error message signal correctly", () => {
      expect(service.errorMessage()).toBeUndefined();
    });

    it("should initialize isInitiallySelectedImpactsLoading signal correctly", () => {
      expect(service.isInitiallySelectedImpactsLoading()).toBeFalsy();
    });
  });

  describe("destroy configuration impact table selection state service", () => {
    it("should complete the destroy subject when ng on destroy is called", () => {
      const configurationImpactSelectionStateDestroySpy = jest.spyOn(
        service["destroy$"],
        "complete"
      );
      service.ngOnDestroy();
      expect(configurationImpactSelectionStateDestroySpy).toHaveBeenCalled();
    });

    it("should emit a value on the destroy subject", () => {
      const configurationImpactSelectionStateDestroySpy = jest.spyOn(
        service["destroy$"],
        "next"
      );
      service.ngOnDestroy();
      expect(configurationImpactSelectionStateDestroySpy).toHaveBeenCalledWith(
        {}
      );
    });

    it("should not fetch configuration impacts ids when the service is destroyed", fakeAsync(() => {
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
        getFullySelectedConfigurationImpact(getSecondConfigurationImpact()),
      ]);
      service.ngOnDestroy();
      tick();
      service.setInitiallySelectedConfigurationImpacts([]);
      expect(configurationImpactService.fetchByIds).toHaveBeenCalledTimes(1);
    }));
  });

  describe("setInitiallySelectedConfigurationImpacts", () => {
    it("should set the initially selected configuration impact ids", fakeAsync(() => {
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact({
          ...getFirstConfigurationImpact(),
          id: "id1",
        }),
        getFullySelectedConfigurationImpact({
          ...getSecondConfigurationImpact(),
          id: "id2",
        }),
      ]);
      tick();
      expect(configurationImpactService.fetchByIds).toHaveBeenCalledWith(
        PROJECT_ID,
        ["id1", "id2"]
      );
    }));

    it("should set the initially selected configuration impacts correctly", fakeAsync(() => {
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
      ]);
      tick();
      expect(service.initiallyConfigurationImpactSelectionStates()).toEqual([
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
      ]);
    }));
  });

  describe("fetch configuration impacts by ids", () => {
    it("should call fetchByIds with the correct ids", fakeAsync(() => {
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact({
          ...getFirstConfigurationImpact(),
          id: "id1",
        }),
        getFullySelectedConfigurationImpact({
          ...getSecondConfigurationImpact(),
          id: "id2",
        }),
      ]);
      tick();
      expect(configurationImpactService.fetchByIds).toHaveBeenCalledWith(
        PROJECT_ID,
        ["id1", "id2"]
      );
    }));
    it("should set the initially selected configuration impact selection states correctly", fakeAsync(() => {
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
      ]);
      tick();
      expect(service.initiallyConfigurationImpactSelectionStates()).toEqual([
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
      ]);
    }));

    it("should set error message signal on failure to fetch configuration impacts by ids", fakeAsync(() => {
      jest
        .spyOn(configurationImpactService, "fetchByIds")
        .mockReturnValueOnce(throwError(() => "error"));
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact({
          ...getFirstConfigurationImpact(),
          id: "id1",
        }),
        getFullySelectedConfigurationImpact({
          ...getSecondConfigurationImpact(),
          id: "id2",
        }),
      ]);
      tick();
      expect(service.errorMessage()).toEqual("error");
    }));

    it("should set _isInitiallySelectedImpactsLoading to true when fetching configuration impacts", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(
        service["_isInitiallySelectedImpactsLoading"],
        "set"
      );
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact({
          ...getFirstConfigurationImpact(),
          id: "id1",
        }),
        getFullySelectedConfigurationImpact({
          ...getSecondConfigurationImpact(),
          id: "id2",
        }),
      ]);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set _isInitiallySelectedImpactsLoading to false when fetchByIds fails", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(
        service["_isInitiallySelectedImpactsLoading"],
        "set"
      );
      jest
        .spyOn(configurationImpactService, "fetchByIds")
        .mockReturnValueOnce(throwError(() => "error"));
      service.setInitiallySelectedConfigurationImpacts([
        getFullySelectedConfigurationImpact({
          ...getFirstConfigurationImpact(),
          id: "id1",
        }),
        getFullySelectedConfigurationImpact({
          ...getSecondConfigurationImpact(),
          id: "id2",
        }),
      ]);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));
  });
});
