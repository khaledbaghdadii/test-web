import { FailureReasonSelectionTableComponent } from "./failure-reason-selection-table.component";
import {
  FailureReason,
  FailureReasonsDataService,
} from "@mxflow/features/failure-management";
import { delay, of, Subject, throwError } from "rxjs";
import { MockBuilder } from "ng-mocks";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Table, TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { By } from "@angular/platform-browser";
import {
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { CheckboxModule } from "primeng/checkbox";
import { DomTestUtils } from "@mxevolve/testing";
import { Type } from "@angular/core";

const ERROR = "failed";

describe("FailureReasonSelectionTableComponent", () => {
  let component: FailureReasonSelectionTableComponent;
  let fixture: ComponentFixture<FailureReasonSelectionTableComponent>;
  let failureReasonService: jest.Mocked<FailureReasonsDataService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  const refresh$ = new Subject<boolean>();

  beforeEach(async () => {
    failureReasonService = {
      getFailureReasons: jest.fn(() => of(getFailureReasons())),
    } as unknown as jest.Mocked<FailureReasonsDataService>;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    await MockBuilder(FailureReasonSelectionTableComponent)
      .keep(Table)
      .keep(TableModule)
      .keep(CheckboxModule)
      .keep(CommonModule)
      .mock(FailureReasonsDataService, failureReasonService)
      .mock(ToastMessageService, toastMessageService);

    fixture = TestBed.createComponent(FailureReasonSelectionTableComponent);
    component = fixture.componentInstance;
    component.refresh = refresh$;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("refresh$", () => {
    it("should not init in case refresh not required", () => {
      const fetchAndInitTable = jest.spyOn(component, "fetchAndInitTable");
      refresh$.next(false);
      expect(fetchAndInitTable).not.toHaveBeenCalled();
    });
    it("should init in case refresh required", () => {
      const fetchAndInitTable = jest.spyOn(component, "fetchAndInitTable");
      refresh$.next(true);
      expect(fetchAndInitTable).toHaveBeenCalled();
    });
    it("should reset the table's data before fetching the failure reasons", () => {
      jest
        .spyOn(failureReasonService, "getFailureReasons")
        .mockReturnValue(of(getFailureReasons()).pipe(delay(3000)));
      refresh$.next(true);
      expect(component.listOfFailureReasons()).toEqual([]);
    });
    it("should set table is loading to true before fetching the failure reasons", () => {
      component.isTableLoading = false;
      jest
        .spyOn(failureReasonService, "getFailureReasons")
        .mockReturnValue(of(getFailureReasons()).pipe(delay(3000)));
      refresh$.next(true);
      expect(component.isTableLoading).toBe(true);
    });
    it("should fetch failure reasons when refresh$ emits a value", () => {
      refresh$.next(true);
      expect(failureReasonService.getFailureReasons).toHaveBeenCalled();
      expect(component.listOfFailureReasons()).toEqual(getFailureReasons());
    });

    it("should not fetch failure reasons when refresh$ does not emit a value", () => {
      expect(failureReasonService.getFailureReasons).not.toHaveBeenCalled();
    });

    it("should initialize the selected failure reasons when refresh$ emits a value", () => {
      jest
        .spyOn(failureReasonService, "getFailureReasons")
        .mockReturnValue(
          of([
            getFirstFailureReason(),
            getSecondFailureReason(),
            getThirdFailureReason(),
          ])
        );
      component.initiallySelectedFailureReasons = [
        {
          ...getFullySelectedFailureReason(getFirstFailureReason()),
        },
      ];
      refresh$.next(true);
      expect(component.selectedFailureReasons()).toEqual([
        getFullySelectedFailureReason(getFirstFailureReason()),
      ]);
    });

    it("should bind the list of failure reasons to the table", () => {
      component.initiallySelectedFailureReasons = [
        getFullySelectedFailureReason(getFirstFailureReason()),
        getFullySelectedFailureReason(getSecondFailureReason()),
      ];
      refresh$.next(true);
      component.listOfFailureReasons.set(getFailureReasons());

      expect(getTableHarness().getValues()).toEqual([
        {
          failureReason: getFirstFailureReason(),
          checked: true,
        },
        {
          failureReason: getSecondFailureReason(),
          checked: true,
        },
      ]);
    });

    it("should set isTableLoading to false after fetching failure reasons", () => {
      component.initiallySelectedFailureReasons = [
        getFullySelectedFailureReason(getFirstFailureReason()),
      ];
      refresh$.next(true);
      expect(component.isTableLoading).toBe(false);
    });

    it("should display error message on failure to fetch the failure reasons", () => {
      const error = new Error(ERROR);
      jest
        .spyOn(failureReasonService, "getFailureReasons")
        .mockReturnValue(throwError(() => error));
      component.initiallySelectedFailureReasons = [
        getFullySelectedFailureReason(getFirstFailureReason()),
      ];
      refresh$.next(true);
      expect(failureReasonService.getFailureReasons).toHaveBeenCalled();
      expect(component.selectedFailureReasons()).toEqual([]);
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    });

    it("should set isTableLoading to false when failed to fetch the failure reasons", () => {
      const error = new Error(ERROR);
      jest
        .spyOn(failureReasonService, "getFailureReasons")
        .mockReturnValue(throwError(() => error));
      refresh$.next(true);
      expect(failureReasonService.getFailureReasons).toHaveBeenCalled();
      expect(component.isTableLoading).toBe(false);
    });

    it("should not initialize the selected failure reasons when failed to fetch the failure reasons", () => {
      const error = new Error(ERROR);
      jest
        .spyOn(failureReasonService, "getFailureReasons")
        .mockReturnValue(throwError(() => error));
      component.initiallySelectedFailureReasons = [
        getFullySelectedFailureReason(getFirstFailureReason()),
      ];
      refresh$.next(true);
      expect(component.selectedFailureReasons()).toEqual([]);
    });

    it("should not keep the list of failure reasons as is on failure to fetch the failure reasons", () => {
      const error = new Error(ERROR);
      jest
        .spyOn(failureReasonService, "getFailureReasons")
        .mockReturnValue(throwError(() => error));
      component.selectedFailureReasons.set([
        getFullySelectedFailureReason(getFirstFailureReason()),
      ]);
      refresh$.next(true);
      expect(component.selectedFailureReasons()).toEqual([]);
    });

    it("should not refresh after component is destroyed", () => {
      jest
        .spyOn(failureReasonService, "getFailureReasons")
        .mockReturnValue(
          of([
            getFirstFailureReason(),
            getSecondFailureReason(),
            getThirdFailureReason(),
          ])
        );
      component.initiallySelectedFailureReasons = [
        getFullySelectedFailureReason(getFirstFailureReason()),
      ];
      const failureReasonServiceSpy = jest.spyOn(
        failureReasonService,
        "getFailureReasons"
      );
      refresh$.next(true);
      expect(failureReasonServiceSpy).toHaveBeenCalled();

      component.ngOnDestroy();
      fixture.detectChanges();
      refresh$.next(true);
      expect(failureReasonServiceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("ngOnDestroy", () => {
    it("should complete the destroy$ subject", () => {
      const destroySpy = jest.spyOn(component["destroy$"], "complete");
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it("should emit a value on the destroy$ subject", () => {
      const destroySpy = jest.spyOn(component["destroy$"], "next");
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalledWith({});
    });
  });

  describe("handleSelectionChange", () => {
    it("should add the failure reason to selectedFailureReasons when checkbox is checked and it was not initially selected", () => {
      const failureReason = getFirstFailureReason();
      component.selectedFailureReasons.set([]);
      component.handleSelectionChange({ checked: true }, failureReason);
      expect(component.selectedFailureReasons()).toEqual([
        getFullySelectedFailureReason(failureReason),
      ]);
    });

    it("should remove the failure reason from selectedFailureReasons when checkbox is unchecked", () => {
      const failureReason = getFirstFailureReason();
      component.selectedFailureReasons.set([
        getFullySelectedFailureReason(failureReason),
      ]);
      component.handleSelectionChange({ checked: false }, failureReason);
      expect(component.selectedFailureReasons()).toEqual([]);
    });

    it("should be called when a row's checkbox selection changes", () => {
      component.initiallySelectedFailureReasons = [];
      component.listOfFailureReasons.set([getFirstFailureReason()]);
      fixture.detectChanges();
      const handleSelectionChangeSpy = jest.spyOn(
        component,
        "handleSelectionChange"
      );
      const rowCheckbox = fixture.debugElement.query(
        By.css('[data-testid="analysisObjectId1"]')
      ).componentInstance;
      rowCheckbox.onChange.emit({ checked: true });
      expect(handleSelectionChangeSpy).toHaveBeenCalledWith(
        { checked: true },
        getFirstFailureReason()
      );
    });
  });

  it("should set the table loading state to true if isTableLoading is true", () => {
    component.isTableLoading = true;
    component.selectedFailureReasonIdsLoading = false;
    expect(getTableHarness().isLoading()).toBeTruthy();
  });

  it("should set the table loading state to true if selectedFailureReasonIdsLoading is true", () => {
    component.selectedFailureReasonIdsLoading = true;
    component.isTableLoading = false;
    expect(getTableHarness().isLoading()).toBeTruthy();
  });

  it("should set the table loading state to false if both isTableLoading and selectedFailureReasonIdsLoading are false", () => {
    component.isTableLoading = false;
    component.selectedFailureReasonIdsLoading = false;
    expect(getTableHarness().isLoading()).toBeFalsy();
  });

  describe("selected analysis objects", () => {
    it("should initialize the selected analysis object to empty array if none are selected", () => {
      component.selectedFailureReasons.set([
        getFullySelectedFailureReason(getFirstFailureReason()),
      ]);
      component.initiallySelectedFailureReasons = [];
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });

    it("should initialize the selected analysis object correctly if some initially selected", fakeAsync(() => {
      component.initiallySelectedFailureReasons = [
        getFullySelectedFailureReason(getFirstFailureReason()),
      ];
      fixture.detectChanges();
      refresh$.next(true);
      tick();
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstFailureReason().id,
          title: getFirstFailureReason().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: undefined,
        } as SelectedAnalysisObject,
      ]);
    }));

    it("should initialize the selected analysis object correctly if none initially selected but added later", () => {
      component.initiallySelectedFailureReasons = [];
      fixture.detectChanges();
      refresh$.next(true);
      component.selectedFailureReasons.set([
        getFullySelectedFailureReason(getFirstFailureReason()),
      ]);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstFailureReason().id,
          title: getFirstFailureReason().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: undefined,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should set the selected analysis object correctly if some initially selected and some added later", () => {
      component.initiallySelectedFailureReasons = [
        getFullySelectedFailureReason(getFirstFailureReason()),
      ];
      fixture.detectChanges();
      refresh$.next(true);
      component.selectedFailureReasons.update((current) => {
        return [
          ...current,
          getFullySelectedFailureReason(getSecondFailureReason()),
        ];
      });
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstFailureReason().id,
          title: getFirstFailureReason().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: undefined,
        } as SelectedAnalysisObject,
        {
          id: getSecondFailureReason().id,
          title: getSecondFailureReason().title,
          selectionType: AnalysisObjectSelectionType.FULL,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should update selected failure reasons when analysis object removed event is emitted", () => {
      component.selectedFailureReasons.set([
        getFullySelectedFailureReason(getFirstFailureReason()),
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstFailureReason().id);
      expect(component.selectedFailureReasons()).toEqual([]);
    });

    it("should update selected analysis objects when analysis object removed event is emitted", () => {
      component.selectedFailureReasons.set([
        getFullySelectedFailureReason(getFirstFailureReason()),
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstFailureReason().id);
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });
  });

  function getFailureReasons(): FailureReason[] {
    return [getFirstFailureReason(), getSecondFailureReason()];
  }

  function getFirstFailureReason(): FailureReason {
    return {
      id: "analysisObjectId1",
      title: "title1",
      description: "description1",
      isEnabled: true,
    };
  }

  function getSecondFailureReason(): FailureReason {
    return {
      id: "analysisObjectId2",
      title: "title2",
      description: "description2",
      isEnabled: true,
    };
  }

  function getThirdFailureReason(): FailureReason {
    return {
      id: "analysisObjectId3",
      title: "title3",
      description: "description3",
      isEnabled: true,
    };
  }

  function getFullySelectedFailureReason(
    failureReason: FailureReason
  ): AnalysisObjectSelectionState<FailureReason> {
    return {
      analysisObject: failureReason,
      selectionType: AnalysisObjectSelectionType.FULL,
    };
  }

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(
      fixture,
      "failure-reasons-selection-table"
    );
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
