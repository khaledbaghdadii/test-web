import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
} from "@mxflow/features/analysis-objects";
import { ConfigurationRegressionTableSelectionStateService } from "./configuration-regression-table-selection-state.service";
import {
  ConfigurationRegressionService,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";
import { Store } from "@ngrx/store";

const PROJECT_ID = "project_id";
const ERROR_MESSAGE = "errorMessage";

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

function getFullySelectedConfigurationRegression(
  ConfigurationRegression: LiteConfigurationRegression
): AnalysisObjectSelectionState<AnalysisObject> {
  return {
    analysisObject: ConfigurationRegression,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

describe("ConfigurationRegressionTableSelectionStateService", () => {
  let store: Store;
  let service: ConfigurationRegressionTableSelectionStateService;
  let configurationRegressionService: ConfigurationRegressionService;

  beforeEach(() => {
    store = {
      select: jest.fn(() => of(PROJECT_ID)),
    } as unknown as Store;

    configurationRegressionService = {
      fetchByIds: jest.fn(() =>
        of([
          getFirstConfigurationRegression(),
          getSecondConfigurationRegression(),
        ])
      ),
    } as unknown as ConfigurationRegressionService;

    TestBed.configureTestingModule({
      providers: [
        ConfigurationRegressionTableSelectionStateService,
        ConfigurationRegressionService,
        {
          provide: ConfigurationRegressionService,
          useValue: configurationRegressionService,
        },
        { provide: Store, useValue: store },
      ],
    });

    service = TestBed.inject(ConfigurationRegressionTableSelectionStateService);
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

    it("should compute configuration regression initially selection states from fetch Configuration regressions by ids response", fakeAsync(() => {
      jest
        .spyOn(configurationRegressionService, "fetchByIds")
        .mockReturnValue(of([getSecondConfigurationRegression()]));
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression(
          getFirstConfigurationRegression()
        ),

        getFullySelectedConfigurationRegression(
          getSecondConfigurationRegression()
        ),
      ]);
      tick();

      expect(service.initiallyConfigurationRegressionSelectionStates()).toEqual(
        [
          getFullySelectedConfigurationRegression(
            getSecondConfigurationRegression()
          ),
        ]
      );
    }));

    it("should initialize error message signal correctly", () => {
      expect(service.errorMessage()).toBeUndefined();
    });

    it("should initialize isInitiallySelectedRegressionsLoading signal correctly", () => {
      expect(service.isInitiallySelectedRegressionsLoading()).toBeFalsy();
    });
  });

  describe("destroy configuration regression table selection state service", () => {
    it("should complete the destroy subject when ng on destroy is called", () => {
      const configurationRegressionSelectionStateDestroySpy = jest.spyOn(
        service["destroy$"],
        "complete"
      );
      service.ngOnDestroy();
      expect(
        configurationRegressionSelectionStateDestroySpy
      ).toHaveBeenCalled();
    });

    it("should emit a value on the destroy subject", () => {
      const configurationRegressionSelectionStateDestroySpy = jest.spyOn(
        service["destroy$"],
        "next"
      );
      service.ngOnDestroy();
      expect(
        configurationRegressionSelectionStateDestroySpy
      ).toHaveBeenCalledWith({});
    });

    it("should not fetch configuration regressions ids when the service is destroyed", fakeAsync(() => {
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression(
          getFirstConfigurationRegression()
        ),
        getFullySelectedConfigurationRegression(
          getSecondConfigurationRegression()
        ),
      ]);
      service.ngOnDestroy();
      tick();
      service.setInitiallySelectedConfigurationRegressions([]);
      expect(configurationRegressionService.fetchByIds).toHaveBeenCalledTimes(
        1
      );
    }));
  });

  describe("setInitiallySelectedConfigurationRegressions", () => {
    it("should set the initially selected configuration regression ids", fakeAsync(() => {
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression({
          ...getFirstConfigurationRegression(),
          id: "id1",
        }),
        getFullySelectedConfigurationRegression({
          ...getSecondConfigurationRegression(),
          id: "id2",
        }),
      ]);
      tick();
      expect(configurationRegressionService.fetchByIds).toHaveBeenCalledWith(
        PROJECT_ID,
        ["id1", "id2"]
      );
    }));

    it("should set the initially selected configuration regressions correctly", fakeAsync(() => {
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression(
          getFirstConfigurationRegression()
        ),
      ]);
      tick();
      expect(service.initiallyConfigurationRegressionSelectionStates()).toEqual(
        [
          getFullySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
        ]
      );
    }));
  });

  describe("fetch configuration regressions by ids", () => {
    it("should call fetchByIds with the correct ids", fakeAsync(() => {
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression({
          ...getFirstConfigurationRegression(),
          id: "id1",
        }),
        getFullySelectedConfigurationRegression({
          ...getSecondConfigurationRegression(),
          id: "id2",
        }),
      ]);
      tick();
      expect(configurationRegressionService.fetchByIds).toHaveBeenCalledWith(
        PROJECT_ID,
        ["id1", "id2"]
      );
    }));
    it("should set the initially selected configuration regression selection states correctly", fakeAsync(() => {
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression(
          getFirstConfigurationRegression()
        ),
      ]);
      tick();
      expect(service.initiallyConfigurationRegressionSelectionStates()).toEqual(
        [
          getFullySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
        ]
      );
    }));

    it("should set error message signal on failure to fetch configuration regressions by ids", fakeAsync(() => {
      jest
        .spyOn(configurationRegressionService, "fetchByIds")
        .mockReturnValueOnce(throwError(() => "error"));
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression({
          ...getFirstConfigurationRegression(),
          id: "id1",
        }),
        getFullySelectedConfigurationRegression({
          ...getSecondConfigurationRegression(),
          id: "id2",
        }),
      ]);
      tick();
      expect(service.errorMessage()).toEqual("error");
    }));

    it("should set _isInitiallySelectedRegressionsLoading to true when fetching configuration regressions", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(
        service["_isInitiallySelectedRegressionsLoading"],
        "set"
      );
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression({
          ...getFirstConfigurationRegression(),
          id: "id1",
        }),
        getFullySelectedConfigurationRegression({
          ...getSecondConfigurationRegression(),
          id: "id2",
        }),
      ]);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set _isInitiallySelectedRegressionsLoading to false when fetchByIds fails", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(
        service["_isInitiallySelectedRegressionsLoading"],
        "set"
      );
      jest
        .spyOn(configurationRegressionService, "fetchByIds")
        .mockReturnValueOnce(throwError(() => "error"));
      service.setInitiallySelectedConfigurationRegressions([
        getFullySelectedConfigurationRegression({
          ...getFirstConfigurationRegression(),
          id: "id1",
        }),
        getFullySelectedConfigurationRegression({
          ...getSecondConfigurationRegression(),
          id: "id2",
        }),
      ]);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));
  });
});
