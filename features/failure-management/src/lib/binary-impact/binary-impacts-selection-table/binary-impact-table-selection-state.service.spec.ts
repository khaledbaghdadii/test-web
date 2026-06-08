import {
  BinaryImpactService,
  LiteBinaryImpact,
} from "@mxflow/features/failure-management";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
} from "@mxflow/features/analysis-objects";
import { BinaryImpactTableSelectionStateService } from "./binary-impact-table-selection-state.service";
import { of, throwError } from "rxjs";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Store } from "@ngrx/store";

const PROJECT_ID = "project1";
const ERROR_MESSAGE = "errorMessage";

function getFirstBinaryImpact(): LiteBinaryImpact {
  return {
    id: "id1",
    projectId: PROJECT_ID,
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
    projectId: PROJECT_ID,
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

function getFullySelectedBinaryImpact(
  impact: LiteBinaryImpact
): AnalysisObjectSelectionState<AnalysisObject> {
  return {
    analysisObject: impact,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

describe("BinaryImpactTableSelectionStateService", () => {
  let service: BinaryImpactTableSelectionStateService;
  let binaryImpactDataService: BinaryImpactService;
  let store: Store;

  beforeEach(() => {
    store = {
      select: jest.fn(() => of(PROJECT_ID)),
    } as unknown as Store;

    binaryImpactDataService = {
      fetchByIds: jest.fn(() =>
        of([getFirstBinaryImpact(), getSecondBinaryImpact()])
      ),
    } as unknown as BinaryImpactService;

    TestBed.configureTestingModule({
      providers: [
        BinaryImpactTableSelectionStateService,
        BinaryImpactService,
        {
          provide: BinaryImpactService,
          useValue: binaryImpactDataService,
        },
        { provide: Store, useValue: store },
      ],
    });

    service = TestBed.inject(BinaryImpactTableSelectionStateService);
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

    it("should initialize initiallySelectedBinaryImpactIds() signal correctly", () => {
      service["_initiallySelectedBinaryImpacts"].set([
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
        getFullySelectedBinaryImpact(getSecondBinaryImpact()),
      ]);
      expect(service["_initiallySelectedBinaryImpacts"]()).toEqual([
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
        getFullySelectedBinaryImpact(getSecondBinaryImpact()),
      ]);
    });

    it("should compute binary impact initially selection states from fetch binary impacts by ids response", fakeAsync(() => {
      jest
        .spyOn(binaryImpactDataService, "fetchByIds")
        .mockReturnValue(of([getSecondBinaryImpact()]));
      service["_initiallySelectedBinaryImpactsIds"].set(["id2"]);
      service["_initiallySelectedBinaryImpacts"].set([
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
        getFullySelectedBinaryImpact(getSecondBinaryImpact()),
      ]);
      tick();

      expect(service["_initiallyBinaryImpactSelectionStates"]()).toEqual([
        getFullySelectedBinaryImpact(getSecondBinaryImpact()),
      ]);
    }));

    it("should initialize error message signal correctly", () => {
      expect(service.errorMessage()).toBeUndefined();
    });

    it("should initialize isInitiallySelectedImpactsLoading signal correctly", () => {
      expect(service.isInitiallySelectedImpactsLoading()).toBeFalsy();
    });
  });

  describe("ngOnDestroy", () => {
    it("should emit a value on the destroy subject", () => {
      const destroySpy = jest.spyOn(service["destroy$"], "next");
      service.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalledWith({});
    });

    it("should not fetch binary impacts ids when the service is destroyed", fakeAsync(() => {
      service["_initiallySelectedBinaryImpactsIds"].set(["id1", "id2"]);
      service.ngOnDestroy();
      tick();
      service.setInitiallySelectedBinaryImpacts([]);
      expect(binaryImpactDataService.fetchByIds).toHaveBeenCalledTimes(1);
    }));

    it("should complete the destroy subject", () => {
      const destroySpy = jest.spyOn(service["destroy$"], "complete");
      service.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe("setInitiallySelectedBinaryImpacts", () => {
    it("should set the initially selected binary impact ids", () => {
      service["_initiallySelectedBinaryImpactsIds"].set([]);
      expect(service["_initiallySelectedBinaryImpactsIds"]()).toEqual([]);
      service.setInitiallySelectedBinaryImpacts([
        getFullySelectedBinaryImpact({
          ...getFirstBinaryImpact(),
          id: "id1",
        }),
        getFullySelectedBinaryImpact({
          ...getSecondBinaryImpact(),
          id: "id2",
        }),
      ]);
      expect(service["_initiallySelectedBinaryImpactsIds"]()).toEqual([
        "id1",
        "id2",
      ]);
    });

    it("should set the initially selected binary impacts correctly", () => {
      service["_initiallySelectedBinaryImpacts"].set([]);
      expect(service["_initiallySelectedBinaryImpacts"]()).toEqual([]);
      service.setInitiallySelectedBinaryImpacts([
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
      ]);
      expect(service["_initiallySelectedBinaryImpacts"]()).toEqual([
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
      ]);
    });
  });

  describe("fetch binary impacts by ids", () => {
    it("should call fetchBinaryImpactsByIds with the correct ids", fakeAsync(() => {
      service["_initiallySelectedBinaryImpactsIds"].set(["id1", "id2"]);
      tick();
      expect(binaryImpactDataService.fetchByIds).toHaveBeenCalledWith(
        PROJECT_ID,
        ["id1", "id2"]
      );
    }));
    it("should set the initially selected binary impact selection states correctly", fakeAsync(() => {
      service["_initiallySelectedBinaryImpactsIds"].set(["id1", "id2"]);
      service["_initiallySelectedBinaryImpacts"].set([
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
      ]);
      tick();
      expect(service.initiallyBinaryImpactSelectionStates()).toEqual([
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
      ]);
    }));

    it("should set error message signal on failure to fetch binary impacts by ids", fakeAsync(() => {
      jest
        .spyOn(binaryImpactDataService, "fetchByIds")
        .mockReturnValueOnce(throwError(() => "error"));
      service["_initiallySelectedBinaryImpactsIds"].set(["id1", "id2"]);
      tick();
      expect(service.errorMessage()).toEqual("error");
    }));

    it("should set _isInitiallySelectedImpactsLoading to true when fetching binary impacts", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(
        service["_isInitiallySelectedImpactsLoading"],
        "set"
      );
      service["_initiallySelectedBinaryImpactsIds"].set(["id1", "id2"]);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set _isInitiallySelectedImpactsLoading to false when fetchBinaryImpactsByIds fails", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(
        service["_isInitiallySelectedImpactsLoading"],
        "set"
      );
      jest
        .spyOn(binaryImpactDataService, "fetchByIds")
        .mockReturnValueOnce(throwError(() => "error"));
      service["_initiallySelectedBinaryImpactsIds"].set(["id1", "id2"]);
      tick();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));
  });
});
