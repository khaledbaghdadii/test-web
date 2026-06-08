import {
  BinaryRegressionSelectionTableComponent,
  BinaryRegressionTableRowSelectionState,
} from "./binary-regression-selection-table.component";
import { LiteBinaryRegression } from "@mxflow/features/failure-management";
import { Subject } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ColumnFilter, TableLazyLoadEvent } from "primeng/table";
import { CommonModule } from "@angular/common";
import { By } from "@angular/platform-browser";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import {
  FilterTranslatorService,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { BinaryRegressionTableStateService } from "./binary-regression-table-state.service";
import { signal, Type, WritableSignal } from "@angular/core";
import { BinaryRegressionTableQuery } from "./binary-regression-table-query.model";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ActivatedRoute } from "@angular/router";
import { BinaryRegressionTableSelectionStateService } from "./binary-regression-table-selection-state.service";
import { ValidationScope } from "@mxflow/features/validation-management";
import { DomTestUtils } from "@mxevolve/testing";

const ERROR = "failed";
const SELECTION_MESSAGE = "SELECTION_MESSAGE";

const BINARY_REGRESSION_TABLE_QUERY: BinaryRegressionTableQuery = {
  page: 1,
  pageSize: 20,
  fixPhrase: "fix",
  ownerPhrase: "owner",
  titlePhrases: ["title1", "title2"],
  defectIdPhrases: ["defect1", "defect2"],
  mxVersionPhrases: ["mxVersion1", "mxVersion2"],
};

type MockBinaryRegressionTableStateService = {
  binaryRegressions: WritableSignal<LiteBinaryRegression[]>;
  totalElements: WritableSignal<number>;
  page: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  errorMessage: WritableSignal<string | undefined>;
  warningMessage: WritableSignal<string | undefined>;
  isLoading: WritableSignal<boolean>;
  refreshBinaryRegressions: jest.Mock;
  setBinaryRegressionsTableQuery: jest.Mock;
  showBinaryRegressionsWithoutDefects: jest.Mock;
  setValidationScope: jest.Mock;
};

type MockBinaryRegressionTableSelectionStateService = {
  initiallyBinaryRegressionSelectionStates: WritableSignal<
    AnalysisObjectSelectionState<LiteBinaryRegression>[]
  >;
  errorMessage: WritableSignal<string | undefined>;
  isInitiallySelectedRegressionsLoading: WritableSignal<boolean>;
  setInitiallySelectedBinaryRegressions: jest.Mock;
};

describe("BinaryRegressionSelectionTableComponent", () => {
  let component: BinaryRegressionSelectionTableComponent;
  let fixture: ComponentFixture<BinaryRegressionSelectionTableComponent>;
  let binaryRegressionTableStateService: MockBinaryRegressionTableStateService;
  let binaryRegressionTableSelectionStateService: MockBinaryRegressionTableSelectionStateService;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let filterTranslator: jest.Mocked<FilterTranslatorService>;
  let analysisObjectSelectionStateService: jest.Mocked<AnalysisObjectTableSelectionStateService>;
  const refresh$ = new Subject<boolean>();

  beforeEach(async () => {
    const binaryRegressions$ = signal<LiteBinaryRegression[]>(
      getBinaryRegressions()
    );
    const totalElements$ = signal<number>(0);
    const page$ = signal<number>(0);
    const pageSize$ = signal<number>(10);
    const initiallyBinaryRegressionSelectionStatesErrorMessage$ = signal<
      string | undefined
    >(undefined);
    const errorMessage$ = signal<string | undefined>(undefined);
    const warningMessage$ = signal<string | undefined>(undefined);
    const isLoading$ = signal<boolean>(false);
    const isInitiallySelectedRegressionsLoading$ = signal<boolean>(false);
    const initiallyBinaryRegressionSelectionStates$ = signal<
      AnalysisObjectSelectionState<LiteBinaryRegression>[]
    >([]);
    binaryRegressionTableStateService = {
      binaryRegressions: binaryRegressions$,
      totalElements: totalElements$,
      page: page$,
      pageSize: pageSize$,
      errorMessage: errorMessage$,
      warningMessage: warningMessage$,
      isLoading: isLoading$,
      refreshBinaryRegressions: jest.fn(),
      setBinaryRegressionsTableQuery: jest.fn(),
      showBinaryRegressionsWithoutDefects: jest.fn(),
      setValidationScope: jest.fn(),
    };

    binaryRegressionTableSelectionStateService = {
      initiallyBinaryRegressionSelectionStates:
        initiallyBinaryRegressionSelectionStates$,
      errorMessage: initiallyBinaryRegressionSelectionStatesErrorMessage$,
      isInitiallySelectedRegressionsLoading:
        isInitiallySelectedRegressionsLoading$,
      setInitiallySelectedBinaryRegressions: jest.fn(),
    };

    filterTranslator = {
      handleTableFiltersChange: jest.fn(() => BINARY_REGRESSION_TABLE_QUERY),
    } as unknown as jest.Mocked<FilterTranslatorService>;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    analysisObjectSelectionStateService = {
      computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection:
        jest.fn(),
      constructFullySelectedAnalysisObjectSelectionStates: jest.fn(),
      isAnalysisObjectFullySelected: jest.fn(),
      isAnalysisObjectPartiallySelected: jest.fn(),
    } as unknown as jest.Mocked<AnalysisObjectTableSelectionStateService>;

    await TestBed.configureTestingModule({
      imports: [
        BinaryRegressionSelectionTableComponent,
        NoopAnimationsModule,
        CommonModule,
      ],
    })
      .overrideComponent(BinaryRegressionSelectionTableComponent, {
        set: {
          providers: [
            {
              provide: BinaryRegressionTableStateService,
              useValue: binaryRegressionTableStateService,
            },
            { provide: FilterTranslatorService, useValue: filterTranslator },
            { provide: ToastMessageService, useValue: toastMessageService },
            {
              provide: AnalysisObjectTableSelectionStateService,
              useValue: analysisObjectSelectionStateService,
            },
            {
              provide: ActivatedRoute,
              useValue: "",
            },
            {
              provide: BinaryRegressionTableSelectionStateService,
              useValue: binaryRegressionTableSelectionStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BinaryRegressionSelectionTableComponent);
    component = fixture.componentInstance;
    component.refresh = refresh$;
    jest.clearAllMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("reading signals from state service", () => {
    it("should read binary regressions from state service", () => {
      binaryRegressionTableStateService.binaryRegressions.set(
        getBinaryRegressions()
      );
      expect(component.listOfRegressions()).toEqual(getBinaryRegressions());
    });

    it("should read total records from state service", () => {
      binaryRegressionTableStateService.totalElements.set(12);
      expect(component.totalRecords()).toEqual(12);
    });

    it("should compute index of the first table row from page index and size", () => {
      binaryRegressionTableStateService.page.set(2);
      binaryRegressionTableStateService.pageSize.set(10);
      expect(component.firstRowIndex()).toEqual(20);
    });

    it("should read errorMessage from state service", () => {
      binaryRegressionTableStateService.errorMessage.set("failed");
      expect(component.errorMessage()).toEqual("failed");
    });

    it("should read isLoading from state service", () => {
      binaryRegressionTableStateService.isLoading.set(true);
      expect(component.isLoading()).toBeTruthy();
    });

    it("should read warningMessage from state service", () => {
      const warningMessage = "warning";
      binaryRegressionTableStateService.warningMessage.set(warningMessage);
      expect(component.warningMessage()).toEqual(warningMessage);
    });

    it("should read isInitiallySelectedRegressionsLoading from binary regression table selection state service", () => {
      binaryRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        true
      );
      expect(component.isInitiallySelectedRegressionsLoading()).toBeTruthy();
    });

    it("should read error message from binary regression table selection state service", () => {
      binaryRegressionTableSelectionStateService.errorMessage.set("failed");
      expect(
        component.initiallyBinaryRegressionSelectionStateErrorMessage()
      ).toEqual("failed");
    });
  });

  describe("refresh$", () => {
    it("should not init in case refresh not required", () => {
      const fetchBinaryRegressions = jest.spyOn(
        binaryRegressionTableStateService,
        "refreshBinaryRegressions"
      );
      refresh$.next(false);
      expect(fetchBinaryRegressions).not.toHaveBeenCalled();
    });

    it("should init in case refresh required", () => {
      const fetchBinaryRegressions = jest.spyOn(
        binaryRegressionTableStateService,
        "refreshBinaryRegressions"
      );
      refresh$.next(true);
      expect(fetchBinaryRegressions).toHaveBeenCalled();
    });

    it("should bind the list of regressions to the table", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockImplementationOnce(() => true)
        .mockImplementationOnce(() => false);

      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockImplementationOnce(() => false)
        .mockImplementationOnce(() => true);

      component.initiallySelectedRegressions = [
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
        getPartiallySelectedBinaryRegression(getSecondBinaryRegression()),
      ] as AnalysisObjectSelectionState<AnalysisObject>[];
      binaryRegressionTableStateService.binaryRegressions.set(
        getBinaryRegressions()
      );

      refresh$.next(true);
      expect(getTableHarness().getValues()).toEqual(getBinaryRegressions());
    });

    it("should display error message on failure to fetch the binary regressions", fakeAsync(() => {
      const error = new Error(ERROR);
      binaryRegressionTableStateService.errorMessage.set(error.message);
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    }));

    it("should display error message on failure to fetch the binary regressions ids for initially selected regressions", fakeAsync(() => {
      const error = new Error(ERROR);
      binaryRegressionTableSelectionStateService.errorMessage.set(
        error.message
      );
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    }));

    it("should not keep the map of binary regressions selection state as is on failure to fetch the binary regressions", () => {
      const error = new Error(ERROR);
      binaryRegressionTableStateService.errorMessage.set(error.message);
      binaryRegressionTableStateService.binaryRegressions.set([]);
      expect(component.tableRowSelectionState()).toEqual(new Map());
      refresh$.next(true);
      expect(component.tableRowSelectionState()).toEqual(new Map());
    });

    it("should not refresh after component is destroyed", fakeAsync(() => {
      const setBinaryRegressionsTableQuery = jest.spyOn(
        binaryRegressionTableStateService,
        "refreshBinaryRegressions"
      );
      component.initiallySelectedRegressions = [
        {
          ...getFullySelectedBinaryRegression(getFirstBinaryRegression()),
          selectionMessage: SELECTION_MESSAGE,
        },
      ];
      refresh$.next(true);
      tick();
      expect(setBinaryRegressionsTableQuery).toHaveBeenCalledTimes(1);

      component.ngOnDestroy();
      tick();
      refresh$.next(true);
      expect(setBinaryRegressionsTableQuery).toHaveBeenCalledTimes(1);
    }));
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

  describe("tableRowSelectionState", () => {
    it("should set the displayed regression as unchecked if regression is not initially linked", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(false);

      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);
      component.initiallySelectedRegressions = [];
      binaryRegressionTableStateService.binaryRegressions.set(
        getBinaryRegressions()
      );
      expect(component.tableRowSelectionState()).toEqual(
        getUncheckedBinaryRegressionTableRowSelectionStates(
          getBinaryRegressions()
        )
      );
    });

    it("should set the displayed regression to checked if the initially selected regression is fully linked", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(true);
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);
      binaryRegressionTableStateService.binaryRegressions.set([
        getFirstBinaryRegression(),
      ]);

      component.initiallySelectedRegressions = [
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
      ];
      const binaryRegressionTableRowSelectionStateMap = new Map<
        string,
        BinaryRegressionTableRowSelectionState
      >([
        [
          getFirstBinaryRegression().id,
          getCheckedBinaryRegressionTableRowSelectionState(),
        ],
      ]);
      binaryRegressionTableStateService.binaryRegressions.set([
        getFirstBinaryRegression(),
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        binaryRegressionTableRowSelectionStateMap
      );
    });

    it("should set the displayed regression to partially selected if the initially selected regression is partially linked", () => {
      binaryRegressionTableStateService.binaryRegressions.set([
        getFirstBinaryRegression(),
      ]);
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(false);
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(true);
      component.initiallySelectedRegressions = [
        getPartiallySelectedBinaryRegression(getFirstBinaryRegression()),
      ];
      const binaryRegressionTableRowSelectionStateMap = new Map<
        string,
        BinaryRegressionTableRowSelectionState
      >([
        [
          getFirstBinaryRegression().id,
          getPartiallyCheckedBinaryRegressionTableRowSelectionState(),
        ],
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        binaryRegressionTableRowSelectionStateMap
      );
    });

    it("should set the displayed regression correctly when both fully and partially linked regression are present", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockImplementationOnce(() => true)
        .mockImplementationOnce(() => false);

      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockImplementationOnce(() => false)
        .mockImplementationOnce(() => true);
      component.initiallySelectedRegressions = [
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
        getPartiallySelectedBinaryRegression(getSecondBinaryRegression()),
      ];
      const binaryRegressionTableRowSelectionStateMap = new Map<
        string,
        BinaryRegressionTableRowSelectionState
      >([
        [
          getFirstBinaryRegression().id,
          getCheckedBinaryRegressionTableRowSelectionState(),
        ],
        [
          getSecondBinaryRegression().id,
          getPartiallyCheckedBinaryRegressionTableRowSelectionState(),
        ],
      ]);
      binaryRegressionTableStateService.binaryRegressions.set(
        getBinaryRegressions()
      );
      expect(component.tableRowSelectionState()).toEqual(
        binaryRegressionTableRowSelectionStateMap
      );
    });

    it("should return a selection state with message when passed", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(true);
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);
      component["selectedBinaryRegressions"].set([
        {
          ...getPartiallySelectedBinaryRegression(getFirstBinaryRegression()),
          selectionMessage: "message",
        },
      ]);
      const binaryRegressionTableRowSelectionStateMap = new Map<
        string,
        BinaryRegressionTableRowSelectionState
      >([
        [
          getFirstBinaryRegression().id,
          {
            selectionState: {
              checked: true,
              partialSelected: false,
              selectionMessage: "message",
            },
          },
        ],
      ]);
      binaryRegressionTableStateService.binaryRegressions.set([
        getFirstBinaryRegression(),
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        binaryRegressionTableRowSelectionStateMap
      );
    });

    it("should call analysisObjectSelectionStateService to compute the selection state", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(false);

      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);
      component.initiallySelectedRegressions = [];
      binaryRegressionTableStateService.binaryRegressions.set(
        getBinaryRegressions()
      );
      component.tableRowSelectionState();
      expect(
        analysisObjectSelectionStateService.isAnalysisObjectFullySelected
      ).toHaveBeenCalledWith(getFirstBinaryRegression(), []);
      expect(
        analysisObjectSelectionStateService.isAnalysisObjectPartiallySelected
      ).toHaveBeenCalledWith(getFirstBinaryRegression(), []);
      expect(
        analysisObjectSelectionStateService.isAnalysisObjectFullySelected
      ).toHaveBeenCalledWith(getSecondBinaryRegression(), []);
      expect(
        analysisObjectSelectionStateService.isAnalysisObjectPartiallySelected
      ).toHaveBeenCalledWith(getSecondBinaryRegression(), []);
    });
  });

  describe("handleSelectionChange", () => {
    it("should add the regression to selectedBinaryRegressions when checkbox is checked and it was not initially selected", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection"
        )
        .mockReturnValue([
          getFullySelectedBinaryRegression(getFirstBinaryRegression()),
        ]);
      const regression = getFirstBinaryRegression();
      component["selectedBinaryRegressions"].set([]);
      component.handleSelectionChange({ checked: true }, regression);
      expect(component.selectedBinaryRegressions()).toEqual([
        getFullySelectedBinaryRegression(regression),
      ]);
    });

    it("should update the partially selected regression to a full selection when checkbox is checked", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection"
        )
        .mockReturnValue([
          getFullySelectedBinaryRegression(getFirstBinaryRegression()),
        ]);
      const regression = getFirstBinaryRegression();
      component["selectedBinaryRegressions"].set([
        getPartiallySelectedBinaryRegression(regression),
      ]);
      component.handleSelectionChange({ checked: true }, regression);
      expect(component.selectedBinaryRegressions()).toEqual([
        getFullySelectedBinaryRegression(regression),
      ]);
    });

    it("should remove the regression from selectedBinaryRegressions when checkbox is unchecked", () => {
      const regression = getFirstBinaryRegression();
      component.initiallySelectedRegressions = [];
      component["selectedBinaryRegressions"].set([
        getFullySelectedBinaryRegression(regression),
      ]);
      component.handleSelectionChange({ checked: false }, regression);
      fixture.detectChanges();
      expect(component.selectedBinaryRegressions()).toEqual([]);
    });

    it("should be called when a row's checkbox is selection changes", () => {
      component.initiallySelectedRegressions = [];
      binaryRegressionTableStateService.binaryRegressions.set([
        getFirstBinaryRegression(),
      ]);
      fixture.detectChanges();
      const handleSelectionChangeSpy = jest.spyOn(
        component,
        "handleSelectionChange"
      );
      const rowCheckbox = fixture.debugElement.query(
        By.css('[data-testid="analysisObjectId1"]')
      ).componentInstance;
      expect(rowCheckbox.onChange).toBeDefined();
      rowCheckbox.onChange.emit({ checked: true });
      expect(handleSelectionChangeSpy).toHaveBeenCalledWith(
        { checked: true },
        getFirstBinaryRegression()
      );
    });
  });

  it("should set the table loading state to true if isLoading of the binary regression table state service is true", () => {
    binaryRegressionTableStateService.isLoading.set(true);
    component.selectedRegressionIdsLoading.set(false);
    expect(component.isTableLoading()).toBe(true);
    expect(getTableHarness().isLoading()).toBe(true);
  });

  it("should set the table loading state to true if isLoading of the binary regression table selection state service is true", () => {
    binaryRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
      true
    );
    component.selectedRegressionIdsLoading.set(false);
    expect(component.isTableLoading()).toBe(true);
    expect(getTableHarness().isLoading()).toBe(true);
  });

  it("should set the table loading state to true if selectedRegressionIdsLoading is true", () => {
    component.selectedRegressionIdsLoading.set(true);
    binaryRegressionTableStateService.isLoading.set(false);
    expect(component.isTableLoading()).toBe(true);
    expect(getTableHarness().isLoading()).toBe(true);
  });

  it("should set the table loading state to false if both isTableLoading and selectedRegressionIdsLoading are false", () => {
    binaryRegressionTableStateService.isLoading.set(false);
    component.selectedRegressionIdsLoading.set(false);
    expect(component.isTableLoading()).toBe(false);
    expect(getTableHarness().isLoading()).toBe(false);
  });

  it("should set the table loading state to false if isTableLoading, isInitiallySelectedRegressionsLoading and selectedRegressionIdsLoading are false", () => {
    binaryRegressionTableStateService.isLoading.set(false);
    component.selectedRegressionIdsLoading.set(false);
    binaryRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
      false
    );
    expect(component.isTableLoading()).toBe(false);
    expect(getTableHarness().isLoading()).toBe(false);
  });

  it("should emit a warning message if its value changes", () => {
    const warningMessage = "warning message";
    expect(component.warningMessage()).toBeUndefined();
    binaryRegressionTableStateService.warningMessage.set(warningMessage);
    fixture.detectChanges();
    expect(component.warningMessage()).toBe(warningMessage);
  });

  it("should emit a warning message change event if warning message is undefined", () => {
    const warningMessage = "warning message";
    const emitSpy = jest.spyOn(component.warningMessageChange, "emit");
    binaryRegressionTableStateService.warningMessage.set(warningMessage);
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith(warningMessage);
    binaryRegressionTableStateService.warningMessage.set(undefined);
    fixture.detectChanges();
    expect(component.warningMessage()).toBeUndefined();
    expect(emitSpy).toHaveBeenCalledWith(undefined);
  });

  describe("selected analysis objects", () => {
    it("should initialize the selected analysis object to empty array if none are selected", () => {
      component.initiallySelectedRegressions = [];
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });

    it("should initialize the selected analysis object correctly if some initially selected", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedRegressions = [
        {
          ...getFullySelectedBinaryRegression(getFirstBinaryRegression()),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteBinaryRegression>,
      ];
      binaryRegressionTableSelectionStateService.initiallyBinaryRegressionSelectionStates.set(
        [
          {
            ...getFullySelectedBinaryRegression(getFirstBinaryRegression()),
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<LiteBinaryRegression>,
        ]
      );
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstBinaryRegression().id,
          title: getFirstBinaryRegression().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if none initially selected but added later", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedRegressions = [];
      fixture.detectChanges();
      refresh$.next(true);
      component["selectedBinaryRegressions"].set([
        {
          ...getFullySelectedBinaryRegression(getFirstBinaryRegression()),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteBinaryRegression>,
      ]);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstBinaryRegression().id,
          title: getFirstBinaryRegression().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if the binary regressions list changes", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(true);

      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);

      component.initiallySelectedRegressions = [
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
      ];
      fixture.detectChanges();
      refresh$.next(true);
      component["selectedBinaryRegressions"].set([
        getFullySelectedBinaryRegression(getFirstBinaryRegression()),
      ]);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstBinaryRegression().id,
          title: getFirstBinaryRegression().title,
          selectionType: AnalysisObjectSelectionType.FULL,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if some initially selected and some added later", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedRegressions = [
        {
          ...getFullySelectedBinaryRegression(getFirstBinaryRegression()),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteBinaryRegression>,
      ];
      binaryRegressionTableSelectionStateService.initiallyBinaryRegressionSelectionStates.set(
        [
          {
            ...getFullySelectedBinaryRegression(getFirstBinaryRegression()),
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<LiteBinaryRegression>,
        ]
      );
      fixture.detectChanges();
      refresh$.next(true);
      component["selectedBinaryRegressions"].update((current) => {
        return [
          ...current,
          {
            ...getPartiallySelectedBinaryRegression(
              getSecondBinaryRegression()
            ),
            selectionType: AnalysisObjectSelectionType.PARTIAL,
          } as AnalysisObjectSelectionState<LiteBinaryRegression>,
        ];
      });
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstBinaryRegression().id,
          title: getFirstBinaryRegression().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
        {
          id: getSecondBinaryRegression().id,
          title: getSecondBinaryRegression().title,
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should update selected binary regressions when analysis object removed event is emitted", () => {
      component.selectedBinaryRegressions.set([
        {
          ...getPartiallySelectedBinaryRegression(getFirstBinaryRegression()),
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as AnalysisObjectSelectionState<LiteBinaryRegression>,
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstBinaryRegression().id);
      fixture.detectChanges();
      expect(component.selectedBinaryRegressions()).toEqual([]);
    });

    it("should update selected analysis objects when analysis object removed event is emitted", () => {
      component.selectedBinaryRegressions.set([
        {
          ...getPartiallySelectedBinaryRegression(getFirstBinaryRegression()),
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as AnalysisObjectSelectionState<LiteBinaryRegression>,
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstBinaryRegression().id);
      fixture.detectChanges();
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });
  });

  describe("handleTableQueryParamsChange", () => {
    it("should translate the filters to a binary regressions table query", () => {
      const tableLazyLoadEvent = {
        first: 11,
        rows: 10,
        filters: {
          titlePhrases: [
            {
              value: ["title"],
            },
          ],
          defectIdPhrases: [
            {
              value: ["defectId"],
            },
          ],
          mxVersionPhrases: [
            {
              value: ["mxVersion"],
            },
          ],
          fixPhrase: {
            value: "fix",
          },
          ownerPhrase: {
            value: "owner",
          },
        },
      };
      component.handleTableQueryParamsChange(tableLazyLoadEvent);
      expect(filterTranslator.handleTableFiltersChange).toHaveBeenCalledWith(
        tableLazyLoadEvent
      );
    });

    it("should update the binary regressions query with the new filters", () => {
      const tableLazyLoadEvent = {
        first: 11,
        rows: 10,
      };
      jest
        .spyOn(filterTranslator, "handleTableFiltersChange")
        .mockReturnValue(BINARY_REGRESSION_TABLE_QUERY);
      component.handleTableQueryParamsChange(tableLazyLoadEvent);
      expect(
        binaryRegressionTableStateService.setBinaryRegressionsTableQuery
      ).toHaveBeenCalledWith(BINARY_REGRESSION_TABLE_QUERY);
    });
  });

  describe("template binding", () => {
    it("should bind binary regressions to template correctly", () => {
      binaryRegressionTableStateService.binaryRegressions.set(
        getBinaryRegressions()
      );
      expect(getTableHarness().getValues()).toEqual(getBinaryRegressions());
    });

    it("should bind total records to template correctly", () => {
      binaryRegressionTableStateService.totalElements.set(12);
      expect(getTableHarness().getTotalRecords()).toEqual(12);
    });

    it("should bind firstRowIndex to template correctly", () => {
      binaryRegressionTableStateService.page.set(2);
      binaryRegressionTableStateService.pageSize.set(10);
      expect(getTableHarness().getFirstRowIndex()).toEqual(20);
    });

    it("should bind isLoading to template correctly", () => {
      expect(getTableHarness().isLoading()).toBeFalsy();
      binaryRegressionTableStateService.isLoading.set(true);
      expect(getTableHarness().isLoading()).toBeTruthy();
    });

    it("should not display loading template when data is ready", () => {
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBe(0);
    });

    it("should display loading template on loading", () => {
      binaryRegressionTableStateService.isLoading.set(true);
      fixture.detectChanges();
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });

    it("should call function on table query params change", () => {
      const handlerSpy = jest.spyOn(component, "handleTableQueryParamsChange");
      const event: TableLazyLoadEvent = { first: 0, last: 10 };
      getTableHarness().emitLazyLoadEvent(event);
      expect(handlerSpy).toHaveBeenCalledWith(event);
    });

    it("should display the empty message template when data is empty", () => {
      binaryRegressionTableStateService.binaryRegressions.set([]);
      expect(getComponent(TableEmptyMessageComponent)).toBeTruthy();
    });
  });

  describe("template filters", () => {
    it("template fix phrase filter should be bound to fixPhrase field", () => {
      fixture.detectChanges();

      const fixColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="fix-column-filter"]')
      ).componentInstance as ColumnFilter;
      const fixFieldName: keyof BinaryRegressionTableQuery = "fixPhrase";
      expect(fixFieldName).toBeDefined();
      expect(fixColumnFilter.field).toBe("fixPhrase");
    });

    it("template defect phrase filter should be bound to defectIdPhrases field", () => {
      fixture.detectChanges();
      const defectColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="defect-column-filter"]')
      ).componentInstance as ColumnFilter;
      const defectFieldName: keyof BinaryRegressionTableQuery =
        "defectIdPhrases";
      expect(defectFieldName).toBeDefined();
      expect(defectColumnFilter.field).toBe("defectIdPhrases");
    });

    it("template owner phrase filter should be bound to ownerPhrase field", () => {
      fixture.detectChanges();
      const ownerColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="owner-column-filter"]')
      ).componentInstance as ColumnFilter;
      const ownerFieldName: keyof BinaryRegressionTableQuery = "ownerPhrase";
      expect(ownerFieldName).toBeDefined();
      expect(ownerColumnFilter.field).toBe("ownerPhrase");
    });

    it("template title phrase filter should be bound to titlePhrases field", () => {
      fixture.detectChanges();
      const titleColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="title-column-filter"]')
      ).componentInstance as ColumnFilter;
      const titleFieldName: keyof BinaryRegressionTableQuery = "titlePhrases";
      expect(titleFieldName).toBeDefined();
      expect(titleColumnFilter.field).toBe("titlePhrases");
    });

    it("template mxVersion phrase filter should be bound to mxVersionPhrases field", () => {
      fixture.detectChanges();
      const mxVersionColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="mxVersion-column-filter"]')
      ).componentInstance as ColumnFilter;
      const mxVersionFieldName: keyof BinaryRegressionTableQuery =
        "mxVersionPhrases";
      expect(mxVersionFieldName).toBeDefined();
      expect(mxVersionColumnFilter.field).toBe("mxVersionPhrases");
    });

    it("should trigger handleTableQueryParamsChange with the correct translated query when template filters change", () => {
      const handlerParamsChangeSpy = jest.spyOn(
        component,
        "handleTableQueryParamsChange"
      );
      const event: TableLazyLoadEvent = {
        first: 0,
        rows: 10,
        filters: { titlePhrases: { value: ["title1"] } },
      };
      const expectedQuery: BinaryRegressionTableQuery = {
        page: 1,
        pageSize: 10,
        titlePhrases: ["title1"],
      };
      filterTranslator.handleTableFiltersChange.mockReturnValue(expectedQuery);
      getTableHarness().emitLazyLoadEvent(event);
      expect(handlerParamsChangeSpy).toHaveBeenCalledWith(event);
      expect(
        binaryRegressionTableStateService.setBinaryRegressionsTableQuery
      ).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe("show binary regressions without defects", () => {
    it.each([true, false])(
      "should delegate to binary regression table state service to show binary regressions without defects when changed to %o",
      (showBinaryRegressionsWithoutDefects) => {
        const showBinaryRegressionsWithoutDefectsSpy = jest.spyOn(
          binaryRegressionTableStateService,
          "showBinaryRegressionsWithoutDefects"
        );
        component.showBinaryRegressionsWithoutDefects =
          showBinaryRegressionsWithoutDefects;
        expect(showBinaryRegressionsWithoutDefectsSpy).toHaveBeenCalledWith(
          showBinaryRegressionsWithoutDefects
        );
      }
    );
  });

  describe("set validation scope", () => {
    it("should delegate to binary regression table state service to set the validation scope when changed", () => {
      const validationScope = getValidationScope();
      const setValidationScopeSpy = jest.spyOn(
        binaryRegressionTableStateService,
        "setValidationScope"
      );
      component.validationScope = validationScope;
      expect(setValidationScopeSpy).toHaveBeenCalledWith(validationScope);
    });
  });

  function getBinaryRegressions(): LiteBinaryRegression[] {
    return [getFirstBinaryRegression(), getSecondBinaryRegression()];
  }

  function getValidationScope(): ValidationScope {
    return {
      currentVersion: "currentVersion",
      referenceVersion: "referenceVersion",
    };
  }

  function getFirstBinaryRegression(): LiteBinaryRegression {
    return {
      id: "analysisObjectId1",
      title: "title1",
      defect: {
        id: "id",
        link: "link",
      },
      owner: "owner1",
      mxVersion: "mxVersion1",
      fix: "fix1",
    };
  }

  function getSecondBinaryRegression(): LiteBinaryRegression {
    return {
      id: "analysisObjectId2",
      title: "title2",
      defect: {
        id: "id",
        link: "link",
      },
      owner: "owner2",
      mxVersion: "mxVersion2",
      fix: "fix2",
    };
  }

  function getCheckedBinaryRegressionTableRowSelectionState(): BinaryRegressionTableRowSelectionState {
    return {
      selectionState: {
        checked: true,
        partialSelected: false,
      },
    };
  }

  function getUncheckedBinaryRegressionTableRowSelectionStates(
    binaryRegressions: LiteBinaryRegression[]
  ): Map<string, BinaryRegressionTableRowSelectionState> {
    return new Map<string, BinaryRegressionTableRowSelectionState>(
      binaryRegressions.map((binaryRegression) => [
        binaryRegression.id,
        getUncheckedBinaryRegressionTableRowSelectionState(),
      ])
    );
  }

  function getUncheckedBinaryRegressionTableRowSelectionState(): BinaryRegressionTableRowSelectionState {
    return {
      selectionState: {
        checked: false,
        partialSelected: false,
      },
    };
  }

  function getFullySelectedBinaryRegression(
    binaryRegression: LiteBinaryRegression
  ): AnalysisObjectSelectionState<LiteBinaryRegression> {
    return {
      analysisObject: binaryRegression,
      selectionType: AnalysisObjectSelectionType.FULL,
    };
  }

  function getPartiallyCheckedBinaryRegressionTableRowSelectionState(): BinaryRegressionTableRowSelectionState {
    return {
      selectionState: {
        checked: false,
        partialSelected: true,
      },
    };
  }

  function getPartiallySelectedBinaryRegression(
    binaryRegression: LiteBinaryRegression
  ): AnalysisObjectSelectionState<LiteBinaryRegression> {
    return {
      analysisObject: binaryRegression,
      selectionType: AnalysisObjectSelectionType.PARTIAL,
    };
  }

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(
      fixture,
      "binary-regressions-selection-table"
    );
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
