import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { LiteBinaryRegression } from "../model/lite-binary-regression.model";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
} from "@mxflow/features/analysis-objects";
import { BinaryRegressionTableSelectionStateService } from "./binary-regression-table-selection-state.service";

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

function getFullySelectedBinaryRegression(
  binaryRegression: LiteBinaryRegression
): AnalysisObjectSelectionState<AnalysisObject> {
  return {
    analysisObject: binaryRegression,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

describe("BinaryRegressionTableSelectionStateService", () => {
  let service: BinaryRegressionTableSelectionStateService;
  let binaryRegressionDataService: BinaryRegressionDataService;

  beforeEach(() => {
    binaryRegressionDataService = {
      fetchByIds: jest.fn(() =>
        of([getFirstBinaryRegression(), getSecondBinaryRegression()])
      ),
    } as unknown as BinaryRegressionDataService;

    TestBed.configureTestingModule({
      providers: [
        BinaryRegressionTableSelectionStateService,
        BinaryRegressionDataService,
        {
          provide: BinaryRegressionDataService,
          useValue: binaryRegressionDataService,
        },
      ],
    });

    service = TestBed.inject(BinaryRegressionTableSelectionStateService);
    TestBed.tick();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("initialization", () => {
    it("should initialize initiallySelectedBinaryRegressionIds() signal correctly", () => {
      service["_initiallySelectedBinaryRegressions"].set([
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
        getFullySelectedBinaryRegression(getSecondBinaryRegression()),
      ]);
      expect(service["_initiallySelectedBinaryRegressions"]()).toEqual([
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
        getFullySelectedBinaryRegression(getSecondBinaryRegression()),
      ]);
    });

    it("should compute binary regression initially selection states from fetch binary regressions by ids response", fakeAsync(() => {
      jest
        .spyOn(binaryRegressionDataService, "fetchByIds")
        .mockReturnValue(of([getSecondBinaryRegression()]));
      service["_initiallySelectedBinaryRegressionsIds"].set(["id2"]);
      service["_initiallySelectedBinaryRegressions"].set([
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
        getFullySelectedBinaryRegression(getSecondBinaryRegression()),
      ]);
      tick();

      expect(service["_initiallyBinaryRegressionSelectionStates"]()).toEqual([
        getFullySelectedBinaryRegression(getSecondBinaryRegression()),
      ]);
    }));

    it("should initialize error message signal correctly", () => {
      expect(service.errorMessage()).toBeUndefined();
    });

    it("should initialize isInitiallySelectedRegressionsLoading signal correctly", () => {
      expect(service.isInitiallySelectedRegressionsLoading()).toBeFalsy();
    });
  });

  describe("destroy binary regression table selection state service", () => {
    it("should complete the destroy subject when ng on destroy is called", () => {
      const binaryRegressionSelectionStateDestroySpy = jest.spyOn(
        service["destroy$"],
        "complete"
      );
      service.ngOnDestroy();
      expect(binaryRegressionSelectionStateDestroySpy).toHaveBeenCalled();
    });

    it("should emit a value on the destroy subject", () => {
      const binaryRegressionSelectionStateDestroySpy = jest.spyOn(
        service["destroy$"],
        "next"
      );
      service.ngOnDestroy();
      expect(binaryRegressionSelectionStateDestroySpy).toHaveBeenCalledWith({});
    });

    it("should not fetch binary regressions ids when the service is destroyed", fakeAsync(() => {
      service["_initiallySelectedBinaryRegressionsIds"].set(["id1", "id2"]);
      service.ngOnDestroy();
      tick();
      service.setInitiallySelectedBinaryRegressions([]);
      expect(binaryRegressionDataService.fetchByIds).toHaveBeenCalledTimes(1);
    }));
  });

  describe("setInitiallySelectedBinaryRegressions", () => {
    it("should set the initially selected binary regression ids", () => {
      service["_initiallySelectedBinaryRegressionsIds"].set([]);
      expect(service["_initiallySelectedBinaryRegressionsIds"]()).toEqual([]);
      service.setInitiallySelectedBinaryRegressions([
        getFullySelectedBinaryRegression({
          ...getFirstBinaryRegression(),
          id: "id1",
        }),
        getFullySelectedBinaryRegression({
          ...getSecondBinaryRegression(),
          id: "id2",
        }),
      ]);
      expect(service["_initiallySelectedBinaryRegressionsIds"]()).toEqual([
        "id1",
        "id2",
      ]);
    });

    it("should set the initially selected binary regressions correctly", () => {
      service["_initiallySelectedBinaryRegressions"].set([]);
      expect(service["_initiallySelectedBinaryRegressions"]()).toEqual([]);
      service.setInitiallySelectedBinaryRegressions([
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
      ]);
      expect(service["_initiallySelectedBinaryRegressions"]()).toEqual([
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
      ]);
    });
  });

  describe("fetch binary regressions by ids", () => {
    it("should call fetchByIds with the correct ids", fakeAsync(() => {
      service["_initiallySelectedBinaryRegressionsIds"].set(["id1", "id2"]);
      tick();
      expect(binaryRegressionDataService.fetchByIds).toHaveBeenCalledWith([
        "id1",
        "id2",
      ]);
    }));
    it("should set the initially selected binary regression selection states correctly", fakeAsync(() => {
      service["_initiallySelectedBinaryRegressionsIds"].set(["id1", "id2"]);
      service["_initiallySelectedBinaryRegressions"].set([
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
      ]);
      tick();
      expect(service.initiallyBinaryRegressionSelectionStates()).toEqual([
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
      ]);
    }));

    it("should set error message signal on failure to fetch binary regressions by ids", fakeAsync(() => {
      jest
        .spyOn(binaryRegressionDataService, "fetchByIds")
        .mockReturnValueOnce(throwError(() => "error"));
      service["_initiallySelectedBinaryRegressionsIds"].set(["id1", "id2"]);
      tick();
      expect(service.errorMessage()).toEqual("error");
    }));

    it("should set _isInitiallySelectedRegressionsLoading to true when fetching binary regressions", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(
        service["_isInitiallySelectedRegressionsLoading"],
        "set"
      );
      service["_initiallySelectedBinaryRegressionsIds"].set(["id1", "id2"]);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set _isInitiallySelectedRegressionsLoading to false when fetchByIds fails", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(
        service["_isInitiallySelectedRegressionsLoading"],
        "set"
      );
      jest
        .spyOn(binaryRegressionDataService, "fetchByIds")
        .mockReturnValueOnce(throwError(() => "error"));
      service["_initiallySelectedBinaryRegressionsIds"].set(["id1", "id2"]);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));
  });
});
