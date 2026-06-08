import {
  ConfigurationRegressionsSelectionTableComponent,
  ConfigurationRegressionTableRowSelectionState,
} from "./configuration-regressions-selection-table.component";
import { of, Subject } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ColumnFilter, TableLazyLoadEvent, TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { DetectionUriBuilderPipe } from "../../detections";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, RouterLinkWithHref } from "@angular/router";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { LiteConfigurationRegression } from "@mxflow/features/failure-management";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { signal, Type, WritableSignal } from "@angular/core";
import {
  FilterTranslatorService,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { ConfigurationRegressionTableQuery } from "./configuration-regression-table-query.model";
import { ConfigurationRegressionTableStateService } from "./configuration-regression-table-state.service";
import { ConfigurationRegressionTableSelectionStateService } from "./configuration-regression-table-selection-state.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DomTestUtils } from "@mxevolve/testing";

const ERROR = "failed";
const PROJECT_ID = "project_id";
const SELECTION_MESSAGE = "SELECTION_MESSAGE";

const CONFIGURATION_REGRESSION_TABLE_QUERY: ConfigurationRegressionTableQuery =
  {
    page: 1,
    pageSize: 20,
    fixPhrase: "fix",
    ownerPhrase: "owner",
    titlePhrases: ["title1", "title2"],
    guiltyChangePhrases: ["guilty1", "guilty2"],
  };

type MockConfigurationRegressionTableStateService = {
  configurationRegressions: WritableSignal<LiteConfigurationRegression[]>;
  totalElements: WritableSignal<number>;
  errorMessage: WritableSignal<string | undefined>;
  isLoading: WritableSignal<boolean>;
  projectId: WritableSignal<string>;
  refreshConfigurationRegressions: jest.Mock;
  setConfigurationRegressionsTableQuery: jest.Mock;
};

type MockConfigurationRegressionTableSelectionStateService = {
  initiallyConfigurationRegressionSelectionStates: WritableSignal<
    AnalysisObjectSelectionState<LiteConfigurationRegression>[]
  >;
  errorMessage: WritableSignal<string | undefined>;
  isInitiallySelectedRegressionsLoading: WritableSignal<boolean>;
  setInitiallySelectedConfigurationRegressions: jest.Mock;
};

describe("ConfigurationRegressionsSelectionTableComponent", () => {
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let filterTranslator: jest.Mocked<FilterTranslatorService>;
  let component: ConfigurationRegressionsSelectionTableComponent;
  let fixture: ComponentFixture<ConfigurationRegressionsSelectionTableComponent>;
  let configurationRegressionTableStateService: MockConfigurationRegressionTableStateService;
  let configurationRegressionTableSelectionStateService: MockConfigurationRegressionTableSelectionStateService;
  let analysisObjectTableSelectionStateService: jest.Mocked<AnalysisObjectTableSelectionStateService>;

  const refresh$ = new Subject<boolean>();

  beforeEach(async () => {
    const initiallyConfigurationRegressionSelectionStatesErrorMessage$ = signal<
      string | undefined
    >(undefined);
    const isInitiallySelectedRegressionsLoading$ = signal<boolean>(false);
    const initiallyConfigurationRegressionSelectionStates$ = signal<
      AnalysisObjectSelectionState<LiteConfigurationRegression>[]
    >([]);

    configurationRegressionTableStateService = {
      configurationRegressions: signal(getConfigurationRegressions()),
      totalElements: signal(0),
      errorMessage: signal(undefined),
      isLoading: signal(false),
      projectId: signal(PROJECT_ID),
      refreshConfigurationRegressions: jest.fn(),
      setConfigurationRegressionsTableQuery: jest.fn(),
    };

    configurationRegressionTableSelectionStateService = {
      initiallyConfigurationRegressionSelectionStates:
        initiallyConfigurationRegressionSelectionStates$,
      errorMessage:
        initiallyConfigurationRegressionSelectionStatesErrorMessage$,
      isInitiallySelectedRegressionsLoading:
        isInitiallySelectedRegressionsLoading$,
      setInitiallySelectedConfigurationRegressions: jest.fn(),
    };

    filterTranslator = {
      handleTableFiltersChange: jest.fn(
        () => CONFIGURATION_REGRESSION_TABLE_QUERY
      ),
    } as unknown as jest.Mocked<FilterTranslatorService>;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    analysisObjectTableSelectionStateService = {
      computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection: jest.fn(
        () =>
          getFullySelectedConfigurationRegressions([
            getFirstConfigurationRegression(),
          ])
      ),
      constructFullySelectedAnalysisObjectSelectionStates: jest.fn(() =>
        getFullySelectedConfigurationRegressions(getConfigurationRegressions())
      ),
      isAnalysisObjectFullySelected: jest.fn(() => true),
      isAnalysisObjectPartiallySelected: jest.fn(() => false),
    } as unknown as jest.Mocked<AnalysisObjectTableSelectionStateService>;

    await TestBed.configureTestingModule({
      imports: [
        ConfigurationRegressionsSelectionTableComponent,
        NoopAnimationsModule,
        CommonModule,
        TableModule,
        DetectionUriBuilderPipe,
      ],
    })
      .overrideComponent(ConfigurationRegressionsSelectionTableComponent, {
        set: {
          providers: [
            {
              provide: ConfigurationRegressionTableStateService,
              useValue: configurationRegressionTableStateService,
            },
            { provide: FilterTranslatorService, useValue: filterTranslator },
            { provide: ToastMessageService, useValue: toastMessageService },
            {
              provide: AnalysisObjectTableSelectionStateService,
              useValue: analysisObjectTableSelectionStateService,
            },
            {
              provide: ActivatedRoute,
              useValue: {
                params: of({
                  projectId: PROJECT_ID,
                }),
              },
            },
            {
              provide: ConfigurationRegressionTableSelectionStateService,
              useValue: configurationRegressionTableSelectionStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(
      ConfigurationRegressionsSelectionTableComponent
    );
    component = fixture.componentInstance;
    component.refresh = refresh$;
    component.projectId = PROJECT_ID;
    component.initiallySelectedConfigurationRegressions =
      getFullySelectedConfigurationRegressions([
        getFirstConfigurationRegression(),
      ]);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("reading signals from state service", () => {
    it("should read configuration regressions from state service", () => {
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );
      expect(component.configurationRegressions()).toEqual(
        getConfigurationRegressions()
      );
    });

    it("should read total records from state service", () => {
      configurationRegressionTableStateService.totalElements.set(12);
      expect(component.totalRecords()).toEqual(12);
    });

    it("should read errorMessage from state service", () => {
      configurationRegressionTableStateService.errorMessage.set("failed");
      expect(component.errorMessage()).toEqual("failed");
    });

    it("should read isLoading from state service", () => {
      configurationRegressionTableStateService.isLoading.set(true);
      expect(component.isLoading()).toBeTruthy();
    });

    it("should read isInitiallySelectedRegressionsLoading from configuration regression table selection state service", () => {
      configurationRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        true
      );
      expect(component.isInitiallySelectedRegressionsLoading()).toBeTruthy();
    });

    it("should read error message from configuration regression table selection state service", () => {
      configurationRegressionTableSelectionStateService.errorMessage.set(
        "failed"
      );
      expect(
        component.initiallyConfigurationRegressionSelectionStateErrorMessage()
      ).toEqual("failed");
    });

    it("should call setInitiallySelectedConfigurationRegressions on configuration regression table set", () => {
      expect(
        configurationRegressionTableSelectionStateService.setInitiallySelectedConfigurationRegressions
      ).toHaveBeenCalledWith(
        getFullySelectedConfigurationRegressions([
          getFirstConfigurationRegression(),
        ])
      );
    });
  });

  describe("refresh$", () => {
    it("should not init in case refresh not required", () => {
      const fetchConfigurationRegressions = jest.spyOn(
        configurationRegressionTableStateService,
        "refreshConfigurationRegressions"
      );
      refresh$.next(false);
      expect(fetchConfigurationRegressions).not.toHaveBeenCalled();
    });

    it("should init in case refresh required", () => {
      const fetchConfigurationRegressions = jest.spyOn(
        configurationRegressionTableStateService,
        "refreshConfigurationRegressions"
      );
      refresh$.next(true);
      expect(fetchConfigurationRegressions).toHaveBeenCalled();
    });

    it("should bind the list of regressions to the table", () => {
      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockImplementationOnce(() => true)
        .mockImplementationOnce(() => false);

      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockImplementationOnce(() => false)
        .mockImplementationOnce(() => true);

      component.initiallySelectedConfigurationRegressions = [
        getFullySelectedConfigurationRegression(
          getFirstConfigurationRegression()
        ),
        getPartiallySelectedConfigurationRegression(
          getSecondConfigurationRegression()
        ),
      ] as AnalysisObjectSelectionState<AnalysisObject>[];
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );

      refresh$.next(true);
      expect(getTableHarness().getValues()).toEqual(
        getConfigurationRegressions()
      );
    });

    it("should not keep the map of configuration regressions selection state as is on failure to fetch the configuration regressions", () => {
      const error = new Error(ERROR);
      configurationRegressionTableStateService.errorMessage.set(error.message);
      configurationRegressionTableStateService.configurationRegressions.set([]);
      expect(component.tableRowSelectionState()).toEqual(new Map());
      refresh$.next(true);
      expect(component.tableRowSelectionState()).toEqual(new Map());
    });

    it("should not refresh after component is destroyed", fakeAsync(() => {
      const setConfigurationRegressionsTableQuery = jest.spyOn(
        configurationRegressionTableStateService,
        "refreshConfigurationRegressions"
      );
      component.initiallySelectedConfigurationRegressions = [
        {
          ...getFullySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
          selectionMessage: SELECTION_MESSAGE,
        },
      ];
      refresh$.next(true);
      tick();
      expect(setConfigurationRegressionsTableQuery).toHaveBeenCalledTimes(1);

      component.ngOnDestroy();
      tick();
      refresh$.next(true);
      expect(setConfigurationRegressionsTableQuery).toHaveBeenCalledTimes(1);
    }));
  });

  describe("handle error messages", () => {
    it("should display error message on failure to fetch the configuration regressions", fakeAsync(() => {
      const error = new Error(ERROR);
      configurationRegressionTableStateService.errorMessage.set(error.message);
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    }));

    it("should display error message on failure to fetch the configuration regressions ids for initially selected regressions", fakeAsync(() => {
      const error = new Error(ERROR);
      configurationRegressionTableSelectionStateService.errorMessage.set(
        error.message
      );
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    }));

    it("should display error message on failure to fetch the configuration regressions and not display the initially selected regressions error again", fakeAsync(() => {
      const error = new Error(ERROR);
      const initiallySelectedError = new Error("initially selected failed");
      configurationRegressionTableSelectionStateService.errorMessage.set(
        initiallySelectedError.message
      );
      configurationRegressionTableStateService.errorMessage.set(error.message);
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        initiallySelectedError.message
      );
      configurationRegressionTableStateService.errorMessage.set("New Error");
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith("New Error");
      expect(toastMessageService.showError).toHaveBeenCalledTimes(3);
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
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(false);

      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);

      component.projectId = PROJECT_ID;
      component.initiallySelectedConfigurationRegressions = [];
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );
      expect(component.tableRowSelectionState()).toEqual(
        getUncheckedConfigurationRegressionTableRowSelectionStates(
          getConfigurationRegressions()
        )
      );
    });

    it("should set the displayed regression to checked if the initially selected regression is fully linked", () => {
      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(true);

      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);
      component.projectId = PROJECT_ID;
      component.initiallySelectedConfigurationRegressions = [
        getFullySelectedConfigurationRegression(
          getFirstConfigurationRegression()
        ),
      ];
      configurationRegressionTableStateService.configurationRegressions.set([
        getFirstConfigurationRegression(),
      ]);
      const configurationRegressionTableRowSelectionStateMap = new Map<
        string,
        ConfigurationRegressionTableRowSelectionState
      >([
        [
          getFirstConfigurationRegression().id,
          getCheckedConfigurationRegressionTableRowSelectionState(),
        ],
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        configurationRegressionTableRowSelectionStateMap
      );
    });

    it("should set the displayed regression to partially selected if the initially selected regression is partially linked", () => {
      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(false);

      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(true);
      component.projectId = PROJECT_ID;
      component.initiallySelectedConfigurationRegressions = [
        getPartiallySelectedConfigurationRegression(
          getFirstConfigurationRegression()
        ),
      ];
      configurationRegressionTableStateService.configurationRegressions.set([
        getFirstConfigurationRegression(),
      ]);
      const configurationRegressionTableRowSelectionStateMap = new Map<
        string,
        ConfigurationRegressionTableRowSelectionState
      >([
        [
          getFirstConfigurationRegression().id,
          getPartiallyCheckedConfigurationRegressionTableRowSelectionState(),
        ],
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        configurationRegressionTableRowSelectionStateMap
      );
    });

    it("should set the displayed regressions correctly when both fully and partially linked regressions are present", () => {
      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockImplementationOnce(() => true)
        .mockImplementationOnce(() => false);

      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockImplementationOnce(() => false)
        .mockImplementationOnce(() => true);
      component.projectId = PROJECT_ID;
      component.initiallySelectedConfigurationRegressions = [
        getFullySelectedConfigurationRegression(
          getFirstConfigurationRegression()
        ),
        getPartiallySelectedConfigurationRegression(
          getSecondConfigurationRegression()
        ),
      ];
      const configurationRegressionTableRowSelectionStateMap = new Map<
        string,
        ConfigurationRegressionTableRowSelectionState
      >([
        [
          getFirstConfigurationRegression().id,
          getCheckedConfigurationRegressionTableRowSelectionState(),
        ],
        [
          getSecondConfigurationRegression().id,
          getPartiallyCheckedConfigurationRegressionTableRowSelectionState(),
        ],
      ]);
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );
      expect(component.tableRowSelectionState()).toEqual(
        configurationRegressionTableRowSelectionStateMap
      );
    });

    it("should return a selection state with message when passed", () => {
      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectFullySelected"
        )
        .mockReturnValue(true);

      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);
      component.projectId = PROJECT_ID;
      component.selectedConfigurationRegressions.set([
        {
          ...getPartiallySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
          selectionMessage: "message",
        },
      ]);
      configurationRegressionTableStateService.configurationRegressions.set([
        getFirstConfigurationRegression(),
      ]);
      const configurationRegressionTableRowSelectionStateMap = new Map<
        string,
        ConfigurationRegressionTableRowSelectionState
      >([
        [
          getFirstConfigurationRegression().id,
          {
            selectionState: {
              checked: true,
              partialSelected: false,
              selectionMessage: "message",
            },
          },
        ],
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        configurationRegressionTableRowSelectionStateMap
      );
    });

    it("should compute the selection state", () => {
      component.projectId = PROJECT_ID;
      component.selectedConfigurationRegressions.set([
        getPartiallySelectedConfigurationRegression(
          getSecondConfigurationRegression()
        ),
      ]);
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );
      fixture.detectChanges();
      expect(
        analysisObjectTableSelectionStateService.isAnalysisObjectFullySelected
      ).toHaveBeenCalledWith(
        getFirstConfigurationRegression(),
        component.selectedConfigurationRegressions()
      );
      expect(
        analysisObjectTableSelectionStateService.isAnalysisObjectPartiallySelected
      ).toHaveBeenCalledWith(
        getFirstConfigurationRegression(),
        component.selectedConfigurationRegressions()
      );
      expect(
        analysisObjectTableSelectionStateService.isAnalysisObjectFullySelected
      ).toHaveBeenCalledWith(
        getSecondConfigurationRegression(),
        component.selectedConfigurationRegressions()
      );
      expect(
        analysisObjectTableSelectionStateService.isAnalysisObjectPartiallySelected
      ).toHaveBeenCalledWith(
        getSecondConfigurationRegression(),
        component.selectedConfigurationRegressions()
      );
    });
  });

  describe("handleSelectionChange", () => {
    it("should add the regression to selectedConfigurationRegressions when checkbox is checked and it was not initially selected", () => {
      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection"
        )
        .mockReturnValue([
          getFullySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
        ]);
      const regression = getFirstConfigurationRegression();
      component.selectedConfigurationRegressions.set([]);
      component.handleSelectionChange({ checked: true }, regression);
      expect(component.selectedConfigurationRegressions()).toEqual([
        getFullySelectedConfigurationRegression(regression),
      ]);
    });

    it("should compute the selection states when adding a new regression", () => {
      const regression = getFirstConfigurationRegression();
      component.selectedConfigurationRegressions.set([
        getPartiallySelectedConfigurationRegression(
          getSecondConfigurationRegression()
        ),
      ]);
      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "isAnalysisObjectPartiallySelected"
        )
        .mockReturnValue(false);
      component.handleSelectionChange({ checked: true }, regression);
      expect(
        analysisObjectTableSelectionStateService.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection
      ).toHaveBeenCalledWith(regression, [
        getPartiallySelectedConfigurationRegression(
          getSecondConfigurationRegression()
        ),
      ]);
    });

    it("should update the partially selected regression to a full selection when checkbox is checked", () => {
      const regression = getFirstConfigurationRegression();
      component.selectedConfigurationRegressions.set([
        getPartiallySelectedConfigurationRegression(regression),
      ]);
      component.handleSelectionChange({ checked: true }, regression);
      expect(component.selectedConfigurationRegressions()).toEqual([
        getFullySelectedConfigurationRegression(regression),
      ]);
    });

    it("should remove the regression from selectedConfigurationRegressions when checkbox is unchecked", () => {
      const regression = getFirstConfigurationRegression();
      component.selectedConfigurationRegressions.set([
        getFullySelectedConfigurationRegression(regression),
      ]);
      component.handleSelectionChange({ checked: false }, regression);
      expect(component.selectedConfigurationRegressions()).toEqual([]);
    });

    it("should be called when a row's checkbox is selection changes", () => {
      component.projectId = PROJECT_ID;
      component.initiallySelectedConfigurationRegressions = [];
      configurationRegressionTableStateService.configurationRegressions.set([
        getFirstConfigurationRegression(),
      ]);
      fixture.detectChanges();
      const handleSelectionChangeSpy = jest.spyOn(
        component,
        "handleSelectionChange"
      );
      const rowCheckbox = fixture.debugElement.query(
        By.css('[data-testid="1"]')
      ).componentInstance;
      rowCheckbox.onChange.emit({ checked: true });
      expect(handleSelectionChangeSpy).toHaveBeenCalledWith(
        { checked: true },
        getFirstConfigurationRegression()
      );
    });
  });

  describe("handleTableQueryParamsChange", () => {
    it("should translate the filters to a configuration regressions table query", () => {
      const tableLazyLoadEvent = {
        first: 11,
        rows: 10,
        filters: {
          titlePhrases: [
            {
              value: ["title"],
            },
          ],
          guiltyChangePhrases: [
            {
              value: ["guiltyChange"],
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

    it("should update the configuration regressions query with the new filters", () => {
      const tableLazyLoadEvent = {
        first: 11,
        rows: 10,
      };
      jest
        .spyOn(filterTranslator, "handleTableFiltersChange")
        .mockReturnValue(CONFIGURATION_REGRESSION_TABLE_QUERY);
      component.handleTableQueryParamsChange(tableLazyLoadEvent);
      expect(
        configurationRegressionTableStateService.setConfigurationRegressionsTableQuery
      ).toHaveBeenCalledWith(CONFIGURATION_REGRESSION_TABLE_QUERY);
    });
  });

  describe("template tests", () => {
    it("should display a loading table while still fetching the data", () => {
      component.selectedRegressionIdsLoading.set(false);
      configurationRegressionTableStateService.isLoading.set(true);
      configurationRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        false
      );
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );
      expect(getTableHarness().isLoading()).toBeTruthy();

      const skeleton =
        fixture.debugElement.nativeElement.querySelector("p-skeleton");
      expect(skeleton).toBeTruthy();
    });

    it("should show rows when loading is done", () => {
      component.selectedRegressionIdsLoading.set(false);
      configurationRegressionTableStateService.isLoading.set(false);
      configurationRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        false
      );
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );
      expect(getTableHarness().getValues()).toEqual(
        getConfigurationRegressions()
      );
      const skeleton =
        fixture.debugElement.nativeElement.querySelector("p-skeleton");
      expect(skeleton).toBeFalsy();
    });

    it("should set the regression link on the title", () => {
      component.selectedRegressionIdsLoading.set(false);
      configurationRegressionTableStateService.isLoading.set(false);
      configurationRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        false
      );
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );
      fixture.detectChanges();

      const regressionTitles = fixture.debugElement.queryAll(
        By.css('[data-testid="configuration-regression-title"]')
      );

      expect(regressionTitles).toBeTruthy();
      expect(regressionTitles.length).toBe(2);

      const firstRouterLinkInstance =
        regressionTitles[0].injector.get(RouterLinkWithHref);
      const secondRouterLinkInstance =
        regressionTitles[1].injector.get(RouterLinkWithHref);

      const firstLinkText = firstRouterLinkInstance.href;
      const secondLinkText = secondRouterLinkInstance.href;

      const expectedFirstLink = `/app/${PROJECT_ID}/detections/regressions/configuration/${
        getFirstConfigurationRegression().id
      }`;
      const expectedSecondLink = `/app/${PROJECT_ID}/detections/regressions/configuration/${
        getSecondConfigurationRegression().id
      }`;

      expect(firstLinkText).toBe(expectedFirstLink);
      expect(secondLinkText).toBe(expectedSecondLink);
    });

    it("should set the table loading state to true if isTableLoading is true", () => {
      component.selectedRegressionIdsLoading.set(false);
      configurationRegressionTableStateService.isLoading.set(true);
      configurationRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        false
      );
      expect(getTableHarness().isLoading()).toBeTruthy();
    });

    it("should set the table loading state to true if selectedRegressionIdsLoading is true", () => {
      component.selectedRegressionIdsLoading.set(true);
      configurationRegressionTableStateService.isLoading.set(true);
      configurationRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        false
      );
      expect(getTableHarness().isLoading()).toBeTruthy();
    });

    it("should set the table loading state to true if isInitiallySelectedRegressionsLoading is true", () => {
      component.selectedRegressionIdsLoading.set(false);
      configurationRegressionTableStateService.isLoading.set(false);
      configurationRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        true
      );
      expect(getTableHarness().isLoading()).toBeTruthy();
    });

    it("should set the table loading state to false if selectedRegressionIdsLoading, isLoading and isInitiallySelectedRegressionsLoading are false", () => {
      component.selectedRegressionIdsLoading.set(false);
      configurationRegressionTableStateService.isLoading.set(false);
      configurationRegressionTableSelectionStateService.isInitiallySelectedRegressionsLoading.set(
        false
      );
      expect(getTableHarness().isLoading()).toBeFalsy();
    });

    it("should bind configuration regressions to template correctly", () => {
      configurationRegressionTableStateService.configurationRegressions.set(
        getConfigurationRegressions()
      );
      expect(getTableHarness().getValues()).toEqual(
        getConfigurationRegressions()
      );
    });

    it("should bind total records to template correctly", () => {
      configurationRegressionTableStateService.totalElements.set(12);
      expect(getTableHarness().getTotalRecords()).toEqual(12);
    });

    it("should bind isLoading to template correctly", () => {
      expect(getTableHarness().isLoading()).toBeFalsy();

      configurationRegressionTableStateService.isLoading.set(true);
      fixture.detectChanges();
      expect(getTableHarness().isLoading()).toBeTruthy();
    });

    it("should not display loading template when data is ready", () => {
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBe(0);
    });

    it("should display loading template on loading", () => {
      configurationRegressionTableStateService.isLoading.set(true);
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
      configurationRegressionTableStateService.configurationRegressions.set([]);
      expect(getComponent(TableEmptyMessageComponent)).toBeTruthy();
    });
  });

  describe("template filters", () => {
    it("template fix phrase filter should be bound to fixPhrase field", () => {
      fixture.detectChanges();

      const fixColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="fix-column-filter"]')
      ).componentInstance as ColumnFilter;
      const fixFieldName: keyof ConfigurationRegressionTableQuery = "fixPhrase";
      expect(fixFieldName).toBeDefined();
      expect(fixColumnFilter.field).toBe("fixPhrase");
    });

    it("template owner phrase filter should be bound to ownerPhrase field", () => {
      fixture.detectChanges();
      const ownerColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="owner-column-filter"]')
      ).componentInstance as ColumnFilter;
      const ownerFieldName: keyof ConfigurationRegressionTableQuery =
        "ownerPhrase";
      expect(ownerFieldName).toBeDefined();
      expect(ownerColumnFilter.field).toBe("ownerPhrase");
    });

    it("template title phrase filter should be bound to titlePhrases field", () => {
      fixture.detectChanges();
      const titleColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="title-column-filter"]')
      ).componentInstance as ColumnFilter;
      const titleFieldName: keyof ConfigurationRegressionTableQuery =
        "titlePhrases";
      expect(titleFieldName).toBeDefined();
      expect(titleColumnFilter.field).toBe("titlePhrases");
    });

    it("template guilty change phrase filter should be bound to guiltyChangePhrases field", () => {
      fixture.detectChanges();
      const guiltyChangeColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="guilty-change-column-filter"]')
      ).componentInstance as ColumnFilter;
      const guiltyChangeFieldName: keyof ConfigurationRegressionTableQuery =
        "guiltyChangePhrases";
      expect(guiltyChangeFieldName).toBeDefined();
      expect(guiltyChangeColumnFilter.field).toBe("guiltyChangePhrases");
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
      const expectedQuery: ConfigurationRegressionTableQuery = {
        page: 1,
        pageSize: 10,
        titlePhrases: ["title1"],
      };
      filterTranslator.handleTableFiltersChange.mockReturnValue(expectedQuery);
      getTableHarness().emitLazyLoadEvent(event);
      expect(handlerParamsChangeSpy).toHaveBeenCalledWith(event);
      expect(
        configurationRegressionTableStateService.setConfigurationRegressionsTableQuery
      ).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe("selected analysis objects", () => {
    it("should initialize the selected analysis object to empty array if none are selected", () => {
      component.initiallySelectedConfigurationRegressions = [];
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });

    it("should initialize the selected analysis object correctly if some initially selected", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedConfigurationRegressions = [
        {
          ...getFullySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),

          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteConfigurationRegression>,
      ];
      configurationRegressionTableSelectionStateService.initiallyConfigurationRegressionSelectionStates.set(
        [
          {
            ...getFullySelectedConfigurationRegression(
              getFirstConfigurationRegression()
            ),
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<LiteConfigurationRegression>,
        ]
      );
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstConfigurationRegression().id,
          title: getFirstConfigurationRegression().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if none initially selected but added later", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedConfigurationRegressions = [];
      fixture.detectChanges();
      refresh$.next(true);
      component.selectedConfigurationRegressions.set([
        {
          ...getFullySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteConfigurationRegression>,
      ]);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstConfigurationRegression().id,
          title: getFirstConfigurationRegression().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if some initially selected and some added later", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedConfigurationRegressions = [
        {
          ...getFullySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteConfigurationRegression>,
      ];
      configurationRegressionTableSelectionStateService.initiallyConfigurationRegressionSelectionStates.set(
        [
          {
            ...getFullySelectedConfigurationRegression(
              getFirstConfigurationRegression()
            ),
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<LiteConfigurationRegression>,
        ]
      );
      fixture.detectChanges();
      refresh$.next(true);
      component.selectedConfigurationRegressions.update((current) => {
        return [
          ...current,
          {
            ...getPartiallySelectedConfigurationRegression(
              getSecondConfigurationRegression()
            ),
            selectionType: AnalysisObjectSelectionType.PARTIAL,
          } as AnalysisObjectSelectionState<LiteConfigurationRegression>,
        ];
      });
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstConfigurationRegression().id,
          title: getFirstConfigurationRegression().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
        {
          id: getSecondConfigurationRegression().id,
          title: getSecondConfigurationRegression().title,
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should update selected configuration regressions when analysis object removed event is emitted", () => {
      component.selectedConfigurationRegressions.set([
        {
          ...getPartiallySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as AnalysisObjectSelectionState<LiteConfigurationRegression>,
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstConfigurationRegression().id);
      expect(component.selectedConfigurationRegressions()).toEqual([]);
    });
    it("should update selected analysis objects when analysis object removed event is emitted", () => {
      component.selectedConfigurationRegressions.set([
        {
          ...getFullySelectedConfigurationRegression(
            getFirstConfigurationRegression()
          ),
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as AnalysisObjectSelectionState<LiteConfigurationRegression>,
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstConfigurationRegression().id);
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });
  });

  function getConfigurationRegressions(): LiteConfigurationRegression[] {
    return [
      getFirstConfigurationRegression(),
      getSecondConfigurationRegression(),
    ];
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

  function getCheckedConfigurationRegressionTableRowSelectionState(): ConfigurationRegressionTableRowSelectionState {
    return {
      selectionState: {
        checked: true,
        partialSelected: false,
      },
    };
  }

  function getPartiallyCheckedConfigurationRegressionTableRowSelectionState(): ConfigurationRegressionTableRowSelectionState {
    return {
      selectionState: {
        checked: false,
        partialSelected: true,
      },
    };
  }

  function getUncheckedConfigurationRegressionTableRowSelectionState(): ConfigurationRegressionTableRowSelectionState {
    return {
      selectionState: {
        checked: false,
        partialSelected: false,
      },
    };
  }

  function getUncheckedConfigurationRegressionTableRowSelectionStates(
    configurationRegressions: LiteConfigurationRegression[]
  ): Map<string, ConfigurationRegressionTableRowSelectionState> {
    return new Map<string, ConfigurationRegressionTableRowSelectionState>(
      configurationRegressions.map((configurationRegression) => [
        configurationRegression.id,
        getUncheckedConfigurationRegressionTableRowSelectionState(),
      ])
    );
  }

  function getFullySelectedConfigurationRegression(
    configurationRegression: LiteConfigurationRegression
  ): AnalysisObjectSelectionState<LiteConfigurationRegression> {
    return {
      analysisObject: configurationRegression,
      selectionType: AnalysisObjectSelectionType.FULL,
    };
  }

  function getFullySelectedConfigurationRegressions(
    configurationRegressions: LiteConfigurationRegression[]
  ): AnalysisObjectSelectionState<LiteConfigurationRegression>[] {
    return configurationRegressions.map((configurationRegression) =>
      getFullySelectedConfigurationRegression(configurationRegression)
    );
  }

  function getPartiallySelectedConfigurationRegression(
    configurationRegression: LiteConfigurationRegression
  ): AnalysisObjectSelectionState<LiteConfigurationRegression> {
    return {
      analysisObject: configurationRegression,
      selectionType: AnalysisObjectSelectionType.PARTIAL,
    };
  }

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(
      fixture,
      "configuration-regressions-selection-table"
    );
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
