import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import {
  BinaryImpactsSelectionTableComponent,
  BinaryImpactTableRowSelectionState,
  LiteBinaryImpact,
} from "@mxflow/features/failure-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { Subject } from "rxjs";
import {
  FilterTranslatorService,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { signal, Type, WritableSignal } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { FetchBinaryImpactsTableQuery } from "./fetch-binary-impacts-table-query.model";
import { BinaryImpactTableStateService } from "./binary-impact-table-state.service";
import { By } from "@angular/platform-browser";
import { ColumnFilter, TableLazyLoadEvent } from "primeng/table";
import { BinaryImpactTableSelectionStateService } from "./binary-impact-table-selection-state.service";
import { ValidationScope } from "@mxflow/features/validation-management";
import { DomTestUtils } from "@mxevolve/testing";

const ERROR = "failed";
const SELECTION_MESSAGE = "SELECTION_MESSAGE";
const PROJECT_ID = "projectId1";

const BINARY_IMPACT_TABLE_QUERY: FetchBinaryImpactsTableQuery = {
  page: 1,
  pageSize: 20,
  titlePhrase: "title1",
  ownerPhrase: "owner",
  mxVersionPhrases: ["mxVersion1", "mxVersion2"],
  upgradeImpactExternalIssuePhrase: "upgradeImpactExternalIssuePhrase",
};

type MockBinaryImpactTableStateService = {
  binaryImpacts: WritableSignal<LiteBinaryImpact[]>;
  totalElements: WritableSignal<number>;
  page: WritableSignal<number>;
  size: WritableSignal<number>;
  errorMessage: WritableSignal<string | undefined>;
  isLoading: WritableSignal<boolean>;
  projectId: WritableSignal<string>;
  setBinaryImpactsTableQuery: jest.Mock;
  setInitiallySelectedBinaryImpacts: jest.Mock;
  refreshBinaryImpacts: jest.Mock;
  warningMessage: WritableSignal<string | undefined>;
  setValidationScope: jest.Mock;
  showImpactsWithoutDefects: jest.Mock;
};

type MockBinaryImpactTableSelectionStateService = {
  initiallyBinaryImpactSelectionStates: WritableSignal<
    AnalysisObjectSelectionState<LiteBinaryImpact>[]
  >;
  errorMessage: WritableSignal<string | undefined>;
  isInitiallySelectedImpactsLoading: WritableSignal<boolean>;
  setInitiallySelectedBinaryImpacts: jest.Mock;
};

const WARNING_MESSAGE = "WARNING_MESSAGE";

describe("BinaryImpactsSelectionTableComponent", () => {
  let component: BinaryImpactsSelectionTableComponent;
  let fixture: ComponentFixture<BinaryImpactsSelectionTableComponent>;
  let binaryImpactTableStateService: MockBinaryImpactTableStateService;
  let binaryImpactTableSelectionStateService: MockBinaryImpactTableSelectionStateService;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let filterTranslator: jest.Mocked<FilterTranslatorService>;
  let analysisObjectSelectionStateService: jest.Mocked<AnalysisObjectTableSelectionStateService>;
  const refresh$ = new Subject<boolean>();

  beforeEach(async () => {
    const initiallyBinaryImpactSelectionStatesErrorMessage$ = signal<
      string | undefined
    >(undefined);
    const isInitiallySelectedImpactsLoading$ = signal<boolean>(false);

    binaryImpactTableStateService = {
      binaryImpacts: signal(getBinaryImpacts()),
      totalElements: signal(0),
      page: signal(0),
      size: signal(10),
      errorMessage: signal(undefined),
      isLoading: signal(false),
      projectId: signal(PROJECT_ID),
      setBinaryImpactsTableQuery: jest.fn(),
      setValidationScope: jest.fn(),
      setInitiallySelectedBinaryImpacts: jest.fn(),
      refreshBinaryImpacts: jest.fn(),
      warningMessage: signal(undefined),
      showImpactsWithoutDefects: jest.fn(),
    };

    const initiallyBinaryImpactSelectionStates$ = signal<
      AnalysisObjectSelectionState<LiteBinaryImpact>[]
    >([]);

    binaryImpactTableSelectionStateService = {
      initiallyBinaryImpactSelectionStates:
        initiallyBinaryImpactSelectionStates$,
      errorMessage: initiallyBinaryImpactSelectionStatesErrorMessage$,
      isInitiallySelectedImpactsLoading: isInitiallySelectedImpactsLoading$,
      setInitiallySelectedBinaryImpacts: jest.fn(),
    };

    filterTranslator = {
      handleTableFiltersChange: jest.fn(() => BINARY_IMPACT_TABLE_QUERY),
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
        BinaryImpactsSelectionTableComponent,
        NoopAnimationsModule,
        CommonModule,
      ],
    })
      .overrideComponent(BinaryImpactsSelectionTableComponent, {
        set: {
          providers: [
            {
              provide: BinaryImpactTableStateService,
              useValue: binaryImpactTableStateService,
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
              provide: BinaryImpactTableSelectionStateService,
              useValue: binaryImpactTableSelectionStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BinaryImpactsSelectionTableComponent);
    component = fixture.componentInstance;
    component.refresh = refresh$;
  });

  describe("validationScope behavior", () => {
    it("should set validationScope correctly", () => {
      const setValidationScopeSpy = jest.spyOn(
        binaryImpactTableStateService,
        "setValidationScope"
      );
      const validationScopeMock = {
        currentVersion: "currentVersion",
        referenceVersion: "referenceVersion",
      } as ValidationScope;

      component.validationScope = validationScopeMock;

      expect(setValidationScopeSpy).toHaveBeenCalledWith(validationScopeMock);
    });
  });

  describe("show impacts without defects", () => {
    it.each([true, false])(
      "should delegate to table state service to show impacts without defects when changed to %o",
      (showImpactsWithoutDefects) => {
        const showImpactsWithoutDefectsSpy = jest.spyOn(
          binaryImpactTableStateService,
          "showImpactsWithoutDefects"
        );
        component.showImpactsWithoutDefects = showImpactsWithoutDefects;
        expect(showImpactsWithoutDefectsSpy).toHaveBeenCalledWith(
          showImpactsWithoutDefects
        );
      }
    );
  });

  describe("initiallySelectedImpacts Input setter", () => {
    it("should call setInitiallySelectedBinaryImpacts only when incoming IDs differ", () => {
      const mockSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        {
          analysisObject: {
            id: "impact-1",
            title: "Impact 1",
          } as AnalysisObject,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: "Selected",
        },
      ];
      binaryImpactTableSelectionStateService.initiallyBinaryImpactSelectionStates.set(
        [
          {
            analysisObject: {
              id: "impact-1",
              title: "Impact 1",
            } as LiteBinaryImpact,
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: "Selected",
          },
        ]
      );

      component.initiallySelectedImpacts = mockSelection;

      expect(
        binaryImpactTableSelectionStateService.setInitiallySelectedBinaryImpacts
      ).not.toHaveBeenCalled();

      const newSelection: AnalysisObjectSelectionState<AnalysisObject>[] = [
        {
          analysisObject: {
            id: "impact-2",
            title: "Impact 2",
          } as AnalysisObject,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: "Selected",
        },
      ];

      component.initiallySelectedImpacts = newSelection;

      expect(
        binaryImpactTableSelectionStateService.setInitiallySelectedBinaryImpacts
      ).toHaveBeenCalledWith(newSelection);
    });
  });

  describe("ngOnDestroy", () => {
    it("should emit a value on the destroy$ subject", () => {
      const destroySpy = jest.spyOn(component["destroy$"], "next");
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalledWith({});
    });
    it("should complete the destroy$ subject", () => {
      const destroySpy = jest.spyOn(component["destroy$"], "complete");
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("reading signals from state service", () => {
    it("should read binary impacts from state service", () => {
      binaryImpactTableStateService.binaryImpacts.set(getBinaryImpacts());
      expect(component.listOfImpacts()).toEqual(getBinaryImpacts());
    });

    it("should read total records from state service", () => {
      binaryImpactTableStateService.totalElements.set(12);
      expect(component.totalRecords()).toEqual(12);
    });

    it("should compute index of the first table row from page index and size", () => {
      binaryImpactTableStateService.page.set(2);
      binaryImpactTableStateService.size.set(10);
      expect(component.firstRowIndex()).toEqual(20);
    });

    it("should read errorMessage from state service", () => {
      binaryImpactTableStateService.errorMessage.set("failed");
      expect(component.errorMessage()).toEqual("failed");
    });

    it("should read warningMessage from state service", () => {
      const warningMessage = "warning";
      binaryImpactTableStateService.warningMessage.set(warningMessage);
      expect(component.warningMessage()).toEqual(warningMessage);
    });

    it("should read isLoading from state service", () => {
      binaryImpactTableStateService.isLoading.set(true);
      expect(component.isLoading()).toBeTruthy();
    });

    it("should read isInitiallySelectedImpactsLoading from binary impact table selection state service", () => {
      binaryImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        true
      );
      expect(component.isInitiallySelectedImpactsLoading()).toBeTruthy();
    });

    it("should read error message from binary impact table selection state service", () => {
      binaryImpactTableSelectionStateService.errorMessage.set("failed");
      expect(
        component.initiallyBinaryImpactSelectionStateErrorMessage()
      ).toEqual("failed");
    });
  });

  describe("refresh$", () => {
    it("should not init in case refresh not required", () => {
      const fetchBinaryImpacts = jest.spyOn(
        binaryImpactTableStateService,
        "refreshBinaryImpacts"
      );
      refresh$.next(false);
      expect(fetchBinaryImpacts).not.toHaveBeenCalled();
    });

    it("should init in case refresh required", () => {
      const fetchBinaryImpacts = jest.spyOn(
        binaryImpactTableStateService,
        "refreshBinaryImpacts"
      );
      refresh$.next(true);
      expect(fetchBinaryImpacts).toHaveBeenCalled();
    });

    it("should bind the list of impacts to the table", () => {
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

      component.initiallySelectedImpacts = [
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
        getPartiallySelectedBinaryImpact(getSecondBinaryImpact()),
      ] as AnalysisObjectSelectionState<AnalysisObject>[];
      binaryImpactTableStateService.binaryImpacts.set(getBinaryImpacts());
      refresh$.next(true);
      expect(getTableHarness().getValues()).toEqual(getBinaryImpacts());
    });

    it("should display error message on failure to fetch the binary impacts", fakeAsync(() => {
      const error = new Error(ERROR);
      binaryImpactTableStateService.errorMessage.set(error.message);
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    }));

    it("should display error message on failure to fetch the binary impacts ids for initially selected impacts", fakeAsync(() => {
      const error = new Error(ERROR);
      binaryImpactTableSelectionStateService.errorMessage.set(error.message);
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    }));

    it("should not keep the map of binary impacts selection state as is on failure to fetch the binary impacts", () => {
      const error = new Error(ERROR);
      binaryImpactTableStateService.errorMessage.set(error.message);
      binaryImpactTableStateService.binaryImpacts.set([]);
      expect(component.tableRowSelectionState()).toEqual(new Map());
      refresh$.next(true);
      expect(component.tableRowSelectionState()).toEqual(new Map());
    });

    it("should not refresh after component is destroyed", fakeAsync(() => {
      const setBinaryImpactsTableQuery = jest.spyOn(
        binaryImpactTableStateService,
        "refreshBinaryImpacts"
      );
      component.initiallySelectedImpacts = [
        {
          ...getFullySelectedBinaryImpact(getFirstBinaryImpact()),
          selectionMessage: SELECTION_MESSAGE,
        },
      ];
      refresh$.next(true);
      tick();
      expect(setBinaryImpactsTableQuery).toHaveBeenCalledTimes(1);

      component.ngOnDestroy();
      tick();
      refresh$.next(true);
      expect(setBinaryImpactsTableQuery).toHaveBeenCalledTimes(1);
    }));
  });

  describe("tableRowSelectionState", () => {
    it("should set the displayed impact as unchecked if impact is not initially linked", () => {
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
      component.initiallySelectedImpacts = [];
      binaryImpactTableStateService.binaryImpacts.set(getBinaryImpacts());
      expect(component.tableRowSelectionState()).toEqual(
        getUncheckedBinaryImpactTableRowSelectionStates(getBinaryImpacts())
      );
    });

    it("should set the displayed impact to checked if the initially selected impact is fully linked", () => {
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
      binaryImpactTableStateService.binaryImpacts.set([getFirstBinaryImpact()]);

      component.initiallySelectedImpacts = [
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
      ];
      const binaryImpactTableRowSelectionStateMap = new Map<
        string,
        BinaryImpactTableRowSelectionState
      >([
        [
          getFirstBinaryImpact().id,
          getCheckedBinaryImpactTableRowSelectionState(),
        ],
      ]);
      binaryImpactTableStateService.binaryImpacts.set([getFirstBinaryImpact()]);
      expect(component.tableRowSelectionState()).toEqual(
        binaryImpactTableRowSelectionStateMap
      );
    });

    it("should set the displayed impact to partially selected if the initially selected impact is partially linked", () => {
      binaryImpactTableStateService.binaryImpacts.set([getFirstBinaryImpact()]);
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
      component.initiallySelectedImpacts = [
        getPartiallySelectedBinaryImpact(getFirstBinaryImpact()),
      ];
      const binaryImpactTableRowSelectionStateMap = new Map<
        string,
        BinaryImpactTableRowSelectionState
      >([
        [
          getFirstBinaryImpact().id,
          getPartiallyCheckedBinaryImpactTableRowSelectionState(),
        ],
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        binaryImpactTableRowSelectionStateMap
      );
    });

    it("should set the displayed impact correctly when both fully and partially linked impact are present", () => {
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
      component.initiallySelectedImpacts = [
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
        getPartiallySelectedBinaryImpact(getSecondBinaryImpact()),
      ];
      const binaryImpactTableRowSelectionStateMap = new Map<
        string,
        BinaryImpactTableRowSelectionState
      >([
        [
          getFirstBinaryImpact().id,
          getCheckedBinaryImpactTableRowSelectionState(),
        ],
        [
          getSecondBinaryImpact().id,
          getPartiallyCheckedBinaryImpactTableRowSelectionState(),
        ],
      ]);
      binaryImpactTableStateService.binaryImpacts.set(getBinaryImpacts());
      expect(component.tableRowSelectionState()).toEqual(
        binaryImpactTableRowSelectionStateMap
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
      component["selectedBinaryImpacts"].set([
        {
          ...getPartiallySelectedBinaryImpact(getFirstBinaryImpact()),
          selectionMessage: "message",
        },
      ]);
      const binaryImpactTableRowSelectionStateMap = new Map<
        string,
        BinaryImpactTableRowSelectionState
      >([
        [
          getFirstBinaryImpact().id,
          {
            selectionState: {
              checked: true,
              partialSelected: false,
              selectionMessage: "message",
            },
          },
        ],
      ]);
      binaryImpactTableStateService.binaryImpacts.set([getFirstBinaryImpact()]);
      expect(component.tableRowSelectionState()).toEqual(
        binaryImpactTableRowSelectionStateMap
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
      component.initiallySelectedImpacts = [];
      binaryImpactTableStateService.binaryImpacts.set(getBinaryImpacts());
      component.tableRowSelectionState();
      expect(
        analysisObjectSelectionStateService.isAnalysisObjectFullySelected
      ).toHaveBeenCalledWith(getFirstBinaryImpact(), []);
      expect(
        analysisObjectSelectionStateService.isAnalysisObjectPartiallySelected
      ).toHaveBeenCalledWith(getFirstBinaryImpact(), []);
      expect(
        analysisObjectSelectionStateService.isAnalysisObjectFullySelected
      ).toHaveBeenCalledWith(getSecondBinaryImpact(), []);
      expect(
        analysisObjectSelectionStateService.isAnalysisObjectPartiallySelected
      ).toHaveBeenCalledWith(getSecondBinaryImpact(), []);
    });
  });

  describe("handleSelectionChange", () => {
    it("should add the impact to selectedBinary impacts when checkbox is checked and it was not initially selected", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection"
        )
        .mockReturnValue([
          getFullySelectedBinaryImpact(getFirstBinaryImpact()),
        ]);
      const impact = getFirstBinaryImpact();
      component["selectedBinaryImpacts"].set([]);
      component.handleSelectionChange({ checked: true }, impact);
      expect(component.selectedBinaryImpacts()).toEqual([
        getFullySelectedBinaryImpact(impact),
      ]);
    });

    it("should update the partially selected impact to a full selection when checkbox is checked", () => {
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection"
        )
        .mockReturnValue([
          getFullySelectedBinaryImpact(getFirstBinaryImpact()),
        ]);
      const impact = getFirstBinaryImpact();
      component["selectedBinaryImpacts"].set([
        getPartiallySelectedBinaryImpact(impact),
      ]);
      component.handleSelectionChange({ checked: true }, impact);
      expect(component.selectedBinaryImpacts()).toEqual([
        getFullySelectedBinaryImpact(impact),
      ]);
    });

    it("should remove the impact from selected binary impacts when checkbox is unchecked", () => {
      const impact = getFirstBinaryImpact();
      component.initiallySelectedImpacts = [];
      component["selectedBinaryImpacts"].set([
        getFullySelectedBinaryImpact(impact),
      ]);
      component.handleSelectionChange({ checked: false }, impact);
      fixture.detectChanges();
      expect(component.selectedBinaryImpacts()).toEqual([]);
    });

    it("should be called when a row's checkbox is selection changes", () => {
      component.initiallySelectedImpacts = [];
      binaryImpactTableStateService.binaryImpacts.set([getFirstBinaryImpact()]);
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
        getFirstBinaryImpact()
      );
    });
  });

  it("should set the table loading state to true if isLoading of the binary impact table state service is true", () => {
    binaryImpactTableStateService.isLoading.set(true);
    component.selectedImpactIdsLoading.set(false);
    expect(component.isTableLoading()).toBe(true);
    expect(getTableHarness().isLoading()).toBe(true);
  });

  it("should set the table loading state to true if isLoading of the binary impact table selection state service is true", () => {
    binaryImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
      true
    );
    component.selectedImpactIdsLoading.set(false);
    expect(component.isTableLoading()).toBe(true);
    expect(getTableHarness().isLoading()).toBe(true);
  });

  it("should set the table loading state to true if selectedImpactIdsLoading is true", () => {
    component.selectedImpactIdsLoading.set(true);
    binaryImpactTableStateService.isLoading.set(false);
    expect(component.isTableLoading()).toBe(true);
    expect(getTableHarness().isLoading()).toBe(true);
  });

  it("should set the table loading state to false if both isTableLoading and selectedImpactIdsLoading are false", () => {
    binaryImpactTableStateService.isLoading.set(false);
    component.selectedImpactIdsLoading.set(false);
    expect(component.isTableLoading()).toBe(false);
    expect(getTableHarness().isLoading()).toBe(false);
  });

  it("should set the table loading state to false if isTableLoading, isInitiallySelectedImpactsLoading and selectedImpactIdsLoading are false", () => {
    binaryImpactTableStateService.isLoading.set(false);
    component.selectedImpactIdsLoading.set(false);
    binaryImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
      false
    );
    expect(component.isTableLoading()).toBe(false);
    expect(getTableHarness().isLoading()).toBe(false);
  });

  it("should emit a warning message if its value changes", () => {
    expect(component.warningMessage()).toBeUndefined();
    binaryImpactTableStateService.warningMessage.set(WARNING_MESSAGE);
    fixture.detectChanges();
    expect(component.warningMessage()).toBe(WARNING_MESSAGE);
  });

  it("should emit a warning message change event if warning message is undefined", () => {
    const emitSpy = jest.spyOn(component.warningMessageChange, "emit");
    binaryImpactTableStateService.warningMessage.set(WARNING_MESSAGE);
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith(WARNING_MESSAGE);
    binaryImpactTableStateService.warningMessage.set(undefined);
    fixture.detectChanges();
    expect(component.warningMessage()).toBeUndefined();
    expect(emitSpy).toHaveBeenCalledWith(undefined);
  });

  describe("selected analysis objects", () => {
    it("should initialize the selected analysis object to empty array if none are selected", () => {
      component.initiallySelectedImpacts = [];
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });

    it("should initialize the selected analysis object correctly if some initially selected", () => {
      const selectionMessage = "selection message";
      binaryImpactTableSelectionStateService.initiallyBinaryImpactSelectionStates.set(
        [
          {
            ...getFullySelectedBinaryImpact(getFirstBinaryImpact()),
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<LiteBinaryImpact>,
        ]
      );
      component.initiallySelectedImpacts = [
        {
          ...getFullySelectedBinaryImpact(getFirstBinaryImpact()),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteBinaryImpact>,
      ];
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstBinaryImpact().id,
          title: getFirstBinaryImpact().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if none initially selected but added later", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedImpacts = [];
      fixture.detectChanges();
      refresh$.next(true);
      component["selectedBinaryImpacts"].set([
        {
          ...getFullySelectedBinaryImpact(getFirstBinaryImpact()),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteBinaryImpact>,
      ]);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstBinaryImpact().id,
          title: getFirstBinaryImpact().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if the binary impacts list changes", () => {
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

      component.initiallySelectedImpacts = [
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
      ];
      fixture.detectChanges();
      refresh$.next(true);
      component["selectedBinaryImpacts"].set([
        getFullySelectedBinaryImpact(getFirstBinaryImpact()),
      ]);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstBinaryImpact().id,
          title: getFirstBinaryImpact().title,
          selectionType: AnalysisObjectSelectionType.FULL,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if some initially selected and some added later", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedImpacts = [
        {
          ...getFullySelectedBinaryImpact(getFirstBinaryImpact()),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteBinaryImpact>,
      ];
      binaryImpactTableSelectionStateService.initiallyBinaryImpactSelectionStates.set(
        [
          {
            ...getFullySelectedBinaryImpact(getFirstBinaryImpact()),
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<LiteBinaryImpact>,
        ]
      );
      fixture.detectChanges();
      refresh$.next(true);
      component["selectedBinaryImpacts"].update((current) => {
        return [
          ...current,
          {
            ...getPartiallySelectedBinaryImpact(getSecondBinaryImpact()),
            selectionType: AnalysisObjectSelectionType.PARTIAL,
          } as AnalysisObjectSelectionState<LiteBinaryImpact>,
        ];
      });
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstBinaryImpact().id,
          title: getFirstBinaryImpact().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
        {
          id: getSecondBinaryImpact().id,
          title: getSecondBinaryImpact().title,
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should update selected binary impacts when analysis object removed event is emitted", () => {
      component.selectedBinaryImpacts.set([
        {
          ...getPartiallySelectedBinaryImpact(getFirstBinaryImpact()),
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as AnalysisObjectSelectionState<LiteBinaryImpact>,
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstBinaryImpact().id);
      fixture.detectChanges();
      expect(component.selectedBinaryImpacts()).toEqual([]);
    });

    it("should update selected analysis objects when analysis object removed event is emitted", () => {
      component["selectedBinaryImpacts"].set([
        {
          ...getPartiallySelectedBinaryImpact(getFirstBinaryImpact()),
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as AnalysisObjectSelectionState<LiteBinaryImpact>,
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstBinaryImpact().id);
      fixture.detectChanges();
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });
  });

  describe("handleTableQueryParamsChange", () => {
    it("should translate the filters to a binary impacts table query", () => {
      const tableLazyLoadEvent = {
        first: 11,
        rows: 10,
        filters: {
          titlePhrase: {
            value: "title",
          },
          upgradeImpactExternalIssuePhrase: {
            value: "upgradeImpactExternalIssue",
          },
          mxVersionPhrases: [
            {
              value: ["mxVersion"],
            },
          ],
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

    it("should update the binary impacts query with the new filters", () => {
      const tableLazyLoadEvent = {
        first: 11,
        rows: 10,
      };
      jest
        .spyOn(filterTranslator, "handleTableFiltersChange")
        .mockReturnValue(BINARY_IMPACT_TABLE_QUERY);
      component.handleTableQueryParamsChange(tableLazyLoadEvent);
      expect(
        binaryImpactTableStateService.setBinaryImpactsTableQuery
      ).toHaveBeenCalledWith(BINARY_IMPACT_TABLE_QUERY);
    });
  });

  describe("template binding", () => {
    it("should bind binary impacts to template correctly", () => {
      binaryImpactTableStateService.binaryImpacts.set(getBinaryImpacts());
      expect(getTableHarness().getValues()).toEqual(getBinaryImpacts());
    });

    it("should bind total records to template correctly", () => {
      binaryImpactTableStateService.totalElements.set(12);
      expect(getTableHarness().getTotalRecords()).toEqual(12);
    });

    it("should bind firstRowIndex to template correctly", () => {
      binaryImpactTableStateService.page.set(2);
      binaryImpactTableStateService.size.set(10);
      expect(getTableHarness().getFirstRowIndex()).toEqual(20);
    });

    it("should bind isLoading to template correctly", () => {
      const tableHarness = getTableHarness();
      expect(tableHarness.isLoading()).toBeFalsy();

      binaryImpactTableStateService.isLoading.set(true);
      fixture.detectChanges();
      expect(tableHarness.isLoading()).toBeTruthy();
    });

    it("should not display loading template when data is ready", () => {
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBe(0);
    });

    it("should display loading template on loading", () => {
      binaryImpactTableStateService.isLoading.set(true);
      fixture.detectChanges();
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });

    it("should call handleTableQueryParamsChange on table query params change", () => {
      const handlerSpy = jest.spyOn(component, "handleTableQueryParamsChange");
      const event: TableLazyLoadEvent = { first: 0, last: 10 };
      getTableHarness().emitLazyLoadEvent(event);
      expect(handlerSpy).toHaveBeenCalledWith(event);
    });

    it("should display the empty message template when data is empty", () => {
      binaryImpactTableStateService.binaryImpacts.set([]);
      expect(getComponent(TableEmptyMessageComponent)).toBeTruthy();
    });
  });

  describe("template filters", () => {
    it("template owner phrase filter should be bound to ownerPhrase field", () => {
      fixture.detectChanges();
      const ownerColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="owner-column-filter"]')
      ).componentInstance as ColumnFilter;
      const ownerFieldName: keyof FetchBinaryImpactsTableQuery = "ownerPhrase";
      expect(ownerFieldName).toBeDefined();
      expect(ownerColumnFilter.field).toBe("ownerPhrase");
    });

    it("template title phrase filter should be bound to titlePhrases field", () => {
      fixture.detectChanges();
      const titleColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="title-column-filter"]')
      ).componentInstance as ColumnFilter;
      const titleFieldName: keyof FetchBinaryImpactsTableQuery = "titlePhrase";
      expect(titleFieldName).toBeDefined();
      expect(titleColumnFilter.field).toBe("titlePhrase");
    });

    it("template upgrade impact external issue id phrase filter should be bound to upgradeImpactExternalIssueId field", () => {
      fixture.detectChanges();
      const externalIssueIdColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="external-issue-column-filter"]')
      ).componentInstance as ColumnFilter;
      const externalIssueIdFieldName: keyof FetchBinaryImpactsTableQuery =
        "upgradeImpactExternalIssuePhrase";
      expect(externalIssueIdFieldName).toBeDefined();
      expect(externalIssueIdColumnFilter.field).toBe(
        "upgradeImpactExternalIssuePhrase"
      );
    });

    it("template mxVersion phrase filter should be bound to mxVersionPhrases field", () => {
      fixture.detectChanges();
      const mxVersionColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="mxVersion-column-filter"]')
      ).componentInstance as ColumnFilter;
      const mxVersionFieldName: keyof FetchBinaryImpactsTableQuery =
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
        filters: { titlePhrase: { value: "title1" } },
      };
      const expectedQuery: FetchBinaryImpactsTableQuery = {
        page: 1,
        pageSize: 10,
        titlePhrase: "title1",
      };
      filterTranslator.handleTableFiltersChange.mockReturnValue(expectedQuery);
      getTableHarness().emitLazyLoadEvent(event);
      expect(handlerParamsChangeSpy).toHaveBeenCalledWith(event);
      expect(
        binaryImpactTableStateService.setBinaryImpactsTableQuery
      ).toHaveBeenCalledWith(expectedQuery);
    });
  });

  function getBinaryImpacts(): LiteBinaryImpact[] {
    return [getFirstBinaryImpact(), getSecondBinaryImpact()];
  }

  function getFirstBinaryImpact(): LiteBinaryImpact {
    return {
      id: "analysisObjectId1",
      projectId: "projectId1",
      title: "title1",
      upgradeImpact: {
        id: "id",
        externalIssue: {
          id: "id",
          link: "link",
        },
      },
      owner: "owner1",
      mxVersion: "mxVersion1",
    };
  }

  function getSecondBinaryImpact(): LiteBinaryImpact {
    return {
      id: "analysisObjectId2",
      projectId: "projectId1",
      title: "title2",
      upgradeImpact: {
        id: "id",
        externalIssue: {
          id: "id",
          link: "link",
        },
      },
      owner: "owner2",
      mxVersion: "mxVersion2",
    };
  }

  function getCheckedBinaryImpactTableRowSelectionState(): BinaryImpactTableRowSelectionState {
    return {
      selectionState: {
        checked: true,
        partialSelected: false,
      },
    };
  }

  function getUncheckedBinaryImpactTableRowSelectionStates(
    binaryImpacts: LiteBinaryImpact[]
  ): Map<string, BinaryImpactTableRowSelectionState> {
    return new Map<string, BinaryImpactTableRowSelectionState>(
      binaryImpacts.map((binaryImpact) => [
        binaryImpact.id,
        getUncheckedBinaryImpactTableRowSelectionState(),
      ])
    );
  }

  function getUncheckedBinaryImpactTableRowSelectionState(): BinaryImpactTableRowSelectionState {
    return {
      selectionState: {
        checked: false,
        partialSelected: false,
      },
    };
  }

  function getFullySelectedBinaryImpact(
    binaryImpact: LiteBinaryImpact
  ): AnalysisObjectSelectionState<LiteBinaryImpact> {
    return {
      analysisObject: binaryImpact,
      selectionType: AnalysisObjectSelectionType.FULL,
    };
  }

  function getPartiallyCheckedBinaryImpactTableRowSelectionState(): BinaryImpactTableRowSelectionState {
    return {
      selectionState: {
        checked: false,
        partialSelected: true,
      },
    };
  }

  function getPartiallySelectedBinaryImpact(
    binaryImpact: LiteBinaryImpact
  ): AnalysisObjectSelectionState<LiteBinaryImpact> {
    return {
      analysisObject: binaryImpact,
      selectionType: AnalysisObjectSelectionType.PARTIAL,
    };
  }

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(
      fixture,
      "binary-impacts-selection-table"
    );
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
