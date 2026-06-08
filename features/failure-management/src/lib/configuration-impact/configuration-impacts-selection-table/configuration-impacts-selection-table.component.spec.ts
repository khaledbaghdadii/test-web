import { of, Subject } from "rxjs";
import {
  DetectionUriBuilderPipe,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfigurationImpactTableRowSelectionState } from "./configuration-impact-table-row-selection-state";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { By } from "@angular/platform-browser";
import { ColumnFilter, TableLazyLoadEvent, TableModule } from "primeng/table";
import { ActivatedRoute, RouterLinkWithHref } from "@angular/router";
import { CommonModule } from "@angular/common";
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
import { ConfigurationImpactTableQuery } from "../../configuration-impact/configuration-impacts-selection-table/configuration-impact-table-query.model";
import { ConfigurationImpactsSelectionTableComponent } from "../../configuration-impact/configuration-impacts-selection-table/configuration-impacts-selection-table.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfigurationImpactTableStateService } from "../../configuration-impact/configuration-impacts-selection-table/configuration-impact-table-state.service";
import { ConfigurationImpactTableSelectionStateService } from "../../configuration-impact/configuration-impacts-selection-table/configuration-impact-table-selection-state.service";
import { DomTestUtils } from "@mxevolve/testing";

const PROJECT_ID = "project_id";
const ERROR = "failed";

const ID_1 = "1";

function getConfigurationImpactTableQuery(): ConfigurationImpactTableQuery {
  return {
    page: 1,
    pageSize: 20,
    ownerPhrase: "owner",
    titlePhrase: "title1",
    guiltyChangePhrase: "guilty1",
  };
}

type MockConfigurationImpactTableStateService = {
  configurationImpacts: WritableSignal<LiteConfigurationImpact[]>;
  totalElements: WritableSignal<number>;
  errorMessage: WritableSignal<string | undefined>;
  isLoading: WritableSignal<boolean>;
  projectId: WritableSignal<string>;
  refreshConfigurationImpacts: jest.Mock;
  setConfigurationImpactsTableQuery: jest.Mock;
};

type MockConfigurationImpactTableSelectionStateService = {
  initiallyConfigurationImpactSelectionStates: WritableSignal<
    AnalysisObjectSelectionState<LiteConfigurationImpact>[]
  >;
  errorMessage: WritableSignal<string | undefined>;
  isInitiallySelectedImpactsLoading: WritableSignal<boolean>;
  setInitiallySelectedConfigurationImpacts: jest.Mock;
};

describe("ConfigurationImpactsSelectionTableComponent", () => {
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let component: ConfigurationImpactsSelectionTableComponent;
  let filterTranslator: jest.Mocked<FilterTranslatorService>;
  let fixture: ComponentFixture<ConfigurationImpactsSelectionTableComponent>;
  let configurationImpactTableStateService: MockConfigurationImpactTableStateService;
  let analysisObjectTableSelectionStateService: jest.Mocked<AnalysisObjectTableSelectionStateService>;
  let configurationImpactTableSelectionStateService: MockConfigurationImpactTableSelectionStateService;

  const refresh$ = new Subject<boolean>();

  beforeEach(async () => {
    const initiallyConfigurationImpactSelectionStatesErrorMessage$ = signal<
      string | undefined
    >(undefined);
    const isInitiallySelectedImpactsLoading$ = signal<boolean>(false);
    const initiallyConfigurationImpactSelectionStates$ = signal<
      AnalysisObjectSelectionState<LiteConfigurationImpact>[]
    >([]);

    configurationImpactTableStateService = {
      configurationImpacts: signal(getConfigurationImpacts()),
      totalElements: signal(0),
      errorMessage: signal(undefined),
      isLoading: signal(false),
      projectId: signal(PROJECT_ID),
      refreshConfigurationImpacts: jest.fn(),
      setConfigurationImpactsTableQuery: jest.fn(),
    };

    configurationImpactTableSelectionStateService = {
      initiallyConfigurationImpactSelectionStates:
        initiallyConfigurationImpactSelectionStates$,
      errorMessage: initiallyConfigurationImpactSelectionStatesErrorMessage$,
      isInitiallySelectedImpactsLoading: isInitiallySelectedImpactsLoading$,
      setInitiallySelectedConfigurationImpacts: jest.fn(),
    };

    filterTranslator = {
      handleTableFiltersChange: jest.fn(() =>
        getConfigurationImpactTableQuery()
      ),
    } as unknown as jest.Mocked<FilterTranslatorService>;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    analysisObjectTableSelectionStateService = {
      computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection: jest.fn(
        () =>
          getFullySelectedConfigurationImpacts([getFirstConfigurationImpact()])
      ),
      constructFullySelectedAnalysisObjectSelectionStates: jest.fn(() =>
        getFullySelectedConfigurationImpacts(getConfigurationImpacts())
      ),
      isAnalysisObjectFullySelected: jest.fn(() => true),
      isAnalysisObjectPartiallySelected: jest.fn(() => false),
    } as unknown as jest.Mocked<AnalysisObjectTableSelectionStateService>;

    await TestBed.configureTestingModule({
      imports: [
        ConfigurationImpactsSelectionTableComponent,
        NoopAnimationsModule,
        CommonModule,
        TableModule,
        DetectionUriBuilderPipe,
      ],
    })
      .overrideComponent(ConfigurationImpactsSelectionTableComponent, {
        set: {
          providers: [
            {
              provide: ConfigurationImpactTableStateService,
              useValue: configurationImpactTableStateService,
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
              provide: ConfigurationImpactTableSelectionStateService,
              useValue: configurationImpactTableSelectionStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(
      ConfigurationImpactsSelectionTableComponent
    );

    component = fixture.componentInstance;
    component.refresh = refresh$;
    component.projectId = PROJECT_ID;
    component.initiallySelectedConfigurationImpacts =
      getFullySelectedConfigurationImpacts([getFirstConfigurationImpact()]);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("reading signals from state service", () => {
    it("should read configuration impacts from state service", () => {
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );
      expect(component.configurationImpacts()).toEqual(
        getConfigurationImpacts()
      );
    });

    it("should read total records from state service", () => {
      configurationImpactTableStateService.totalElements.set(12);
      expect(component.totalRecords()).toEqual(12);
    });

    it("should read errorMessage from state service", () => {
      configurationImpactTableStateService.errorMessage.set("failed");
      expect(component.errorMessage()).toEqual("failed");
    });

    it("should read isLoading from state service", () => {
      configurationImpactTableStateService.isLoading.set(true);
      expect(component.isLoading()).toBeTruthy();
    });

    it("should read isInitiallySelectedImpactsLoading from configuration impact table selection state service", () => {
      configurationImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        true
      );
      expect(component.isInitiallySelectedImpactsLoading()).toBeTruthy();
    });

    it("should read error message from configuration impact table selection state service", () => {
      configurationImpactTableSelectionStateService.errorMessage.set("failed");
      expect(
        component.initiallyConfigurationImpactSelectionStateErrorMessage()
      ).toEqual("failed");
    });

    it("should call setInitiallySelectedConfigurationImpacts on configuration impact table set", () => {
      expect(
        configurationImpactTableSelectionStateService.setInitiallySelectedConfigurationImpacts
      ).toHaveBeenCalledWith(
        getFullySelectedConfigurationImpacts([getFirstConfigurationImpact()])
      );
    });
  });

  describe("refresh", () => {
    it("should not init in case refresh not required", () => {
      const fetchConfigurationImpacts = jest.spyOn(
        configurationImpactTableStateService,
        "refreshConfigurationImpacts"
      );
      refresh$.next(false);
      expect(fetchConfigurationImpacts).not.toHaveBeenCalled();
    });

    it("should init in case refresh is required", () => {
      const fetchConfigurationImpacts = jest.spyOn(
        configurationImpactTableStateService,
        "refreshConfigurationImpacts"
      );
      refresh$.next(true);
      expect(fetchConfigurationImpacts).toHaveBeenCalled();
    });

    it("should bind the list of impacts to the table", () => {
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

      component.initiallySelectedConfigurationImpacts = [
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
        getPartiallySelectedConfigurationImpact(getSecondConfigurationImpact()),
      ] as AnalysisObjectSelectionState<AnalysisObject>[];
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );
      refresh$.next(true);
      expect(getTableHarness().getValues()).toEqual(getConfigurationImpacts());
    });

    it("should not keep the map of configuration impacts selection state as is on failure to fetch the configuration impacts", () => {
      const error = new Error(ERROR);
      configurationImpactTableStateService.errorMessage.set(error.message);
      configurationImpactTableStateService.configurationImpacts.set([]);
      expect(component.tableRowSelectionState()).toEqual(new Map());
      refresh$.next(true);
      expect(component.tableRowSelectionState()).toEqual(new Map());
    });

    it("should not keep listening to refresh upon destroy", fakeAsync(() => {
      const setConfigurationImpactsTableQuery = jest.spyOn(
        configurationImpactTableStateService,
        "refreshConfigurationImpacts"
      );
      component.initiallySelectedConfigurationImpacts = [
        {
          ...getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
          selectionMessage: "selection message",
        },
      ];
      refresh$.next(true);
      tick();
      expect(setConfigurationImpactsTableQuery).toHaveBeenCalledTimes(1);

      component.ngOnDestroy();
      tick();
      refresh$.next(true);
      expect(setConfigurationImpactsTableQuery).toHaveBeenCalledTimes(1);
    }));
  });

  describe("handle error messages", () => {
    it("should display error message on failure to fetch the configuration impacts", fakeAsync(() => {
      const error = new Error(ERROR);
      configurationImpactTableStateService.errorMessage.set(error.message);
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    }));

    it("should display error message on failure to fetch the configuration impacts ids for initially selected impacts", fakeAsync(() => {
      const error = new Error(ERROR);
      configurationImpactTableSelectionStateService.errorMessage.set(
        error.message
      );
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
    }));

    it("should display error message on failure to fetch the configuration impacts and not display the initially selected impacts error again", fakeAsync(() => {
      const error = new Error(ERROR);
      const initiallySelectedError = new Error("initially selected failed");
      configurationImpactTableSelectionStateService.errorMessage.set(
        initiallySelectedError.message
      );
      configurationImpactTableStateService.errorMessage.set(error.message);
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(ERROR);
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        initiallySelectedError.message
      );
      configurationImpactTableStateService.errorMessage.set("New Error");
      fixture.detectChanges();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith("New Error");
      expect(toastMessageService.showError).toHaveBeenCalledTimes(3);
    }));
  });

  describe("tableRowSelectionState", () => {
    it("should set the displayed impact as unchecked if impact is not initially linked", () => {
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
      component.initiallySelectedConfigurationImpacts = [];
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );
      expect(component.tableRowSelectionState()).toEqual(
        getUncheckedConfigurationImpactTableRowSelectionStates(
          getConfigurationImpacts()
        )
      );
    });

    it("should set the displayed impact to checked if the initially selected impact is fully linked", () => {
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
      component.initiallySelectedConfigurationImpacts = [
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
      ];
      configurationImpactTableStateService.configurationImpacts.set([
        getFirstConfigurationImpact(),
      ]);
      const configurationImpactTableRowSelectionStateMap = new Map<
        string,
        ConfigurationImpactTableRowSelectionState
      >([
        [
          getFirstConfigurationImpact().id,
          getCheckedConfigurationImpactTableRowSelectionState(),
        ],
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        configurationImpactTableRowSelectionStateMap
      );
    });

    it("should set the displayed impact to partially selected if the initially selected impact is partially linked", () => {
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
      component.initiallySelectedConfigurationImpacts = [
        getPartiallySelectedConfigurationImpact(getFirstConfigurationImpact()),
      ];
      configurationImpactTableStateService.configurationImpacts.set([
        getFirstConfigurationImpact(),
      ]);
      const configurationImpactTableRowSelectionStateMap = new Map<
        string,
        ConfigurationImpactTableRowSelectionState
      >([
        [
          getFirstConfigurationImpact().id,
          getPartiallyCheckedConfigurationImpactTableRowSelectionState(),
        ],
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        configurationImpactTableRowSelectionStateMap
      );
    });

    it("should set the displayed impacts correctly when both fully and partially linked impacts are present", () => {
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
      component.initiallySelectedConfigurationImpacts = [
        getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
        getPartiallySelectedConfigurationImpact(getSecondConfigurationImpact()),
      ];
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );
      const configurationImpactTableRowSelectionStateMap = new Map<
        string,
        ConfigurationImpactTableRowSelectionState
      >([
        [
          getFirstConfigurationImpact().id,
          getCheckedConfigurationImpactTableRowSelectionState(),
        ],
        [
          getSecondConfigurationImpact().id,
          getPartiallyCheckedConfigurationImpactTableRowSelectionState(),
        ],
      ]);
      expect(component.tableRowSelectionState()).toEqual(
        configurationImpactTableRowSelectionStateMap
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
      component.selectedConfigurationImpacts.set([
        {
          ...getPartiallySelectedConfigurationImpact(
            getFirstConfigurationImpact()
          ),
          selectionMessage: "message",
        },
      ]);
      configurationImpactTableStateService.configurationImpacts.set([
        getFirstConfigurationImpact(),
      ]);
      const configurationImpactTableRowSelectionStateMap = new Map<
        string,
        ConfigurationImpactTableRowSelectionState
      >([
        [
          getFirstConfigurationImpact().id,
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
        configurationImpactTableRowSelectionStateMap
      );
    });

    it("should compute the selection state", () => {
      component.projectId = PROJECT_ID;
      component.selectedConfigurationImpacts.set([
        getPartiallySelectedConfigurationImpact(getSecondConfigurationImpact()),
      ]);
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );
      fixture.detectChanges();
      expect(
        analysisObjectTableSelectionStateService.isAnalysisObjectFullySelected
      ).toHaveBeenCalledWith(
        getFirstConfigurationImpact(),
        component.selectedConfigurationImpacts()
      );
      expect(
        analysisObjectTableSelectionStateService.isAnalysisObjectPartiallySelected
      ).toHaveBeenCalledWith(
        getFirstConfigurationImpact(),
        component.selectedConfigurationImpacts()
      );
      expect(
        analysisObjectTableSelectionStateService.isAnalysisObjectFullySelected
      ).toHaveBeenCalledWith(
        getSecondConfigurationImpact(),
        component.selectedConfigurationImpacts()
      );
      expect(
        analysisObjectTableSelectionStateService.isAnalysisObjectPartiallySelected
      ).toHaveBeenCalledWith(
        getSecondConfigurationImpact(),
        component.selectedConfigurationImpacts()
      );
    });
  });

  describe("handleSelectionChange", () => {
    it("should add the impact to selectedConfigurationImpacts when checkbox is checked and it was not initially selected", () => {
      jest
        .spyOn(
          analysisObjectTableSelectionStateService,
          "computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection"
        )
        .mockReturnValue([
          getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
        ]);
      const impact = getFirstConfigurationImpact();
      component.selectedConfigurationImpacts.set([]);
      component.handleSelectionChange({ checked: true }, impact);
      expect(component.selectedConfigurationImpacts()).toEqual([
        getFullySelectedConfigurationImpact(impact),
      ]);
    });

    it("should compute the selection states when adding a new impact", () => {
      const impact = getFirstConfigurationImpact();
      component.selectedConfigurationImpacts.set([
        getPartiallySelectedConfigurationImpact(getSecondConfigurationImpact()),
      ]);
      component.handleSelectionChange({ checked: true }, impact);
      expect(
        analysisObjectTableSelectionStateService.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection
      ).toHaveBeenCalledWith(impact, [
        getPartiallySelectedConfigurationImpact(getSecondConfigurationImpact()),
      ]);
    });

    it("should update the partially selected impact to a full selection when checkbox is checked", () => {
      const impact = getFirstConfigurationImpact();
      component.selectedConfigurationImpacts.set([
        getPartiallySelectedConfigurationImpact(impact),
      ]);
      component.handleSelectionChange({ checked: true }, impact);
      expect(component.selectedConfigurationImpacts()).toEqual([
        getFullySelectedConfigurationImpact(impact),
      ]);
    });

    it("should remove the impact from selectedConfigurationImpacts when checkbox is unchecked", () => {
      const impact = getFirstConfigurationImpact();
      component.selectedConfigurationImpacts.set([
        getFullySelectedConfigurationImpact(impact),
      ]);
      component.handleSelectionChange({ checked: false }, impact);
      expect(component.selectedConfigurationImpacts()).toEqual([]);
    });

    it("should be called when a row's checkbox is selection changes", () => {
      component.projectId = PROJECT_ID;
      component.initiallySelectedConfigurationImpacts = [];
      configurationImpactTableStateService.configurationImpacts.set([
        getFirstConfigurationImpact(),
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
        getFirstConfigurationImpact()
      );
    });
  });

  describe("handleTableQueryParamsChange", () => {
    it("should translate the filters to a configuration impacts table query", () => {
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
        tableLazyLoadEvent,
        { markEmptyStringAsUndefined: true }
      );
    });

    it("should update the configuration impacts query with the new filters", () => {
      const tableLazyLoadEvent = {
        first: 11,
        rows: 10,
      };
      jest
        .spyOn(filterTranslator, "handleTableFiltersChange")
        .mockReturnValue(getConfigurationImpactTableQuery());
      component.handleTableQueryParamsChange(tableLazyLoadEvent);
      expect(
        configurationImpactTableStateService.setConfigurationImpactsTableQuery
      ).toHaveBeenCalledWith(getConfigurationImpactTableQuery());
    });
  });

  describe("template tests", () => {
    it("should display table as loading while still fetching the data", () => {
      component.selectedImpactIdsLoading.set(false);
      configurationImpactTableStateService.isLoading.set(true);
      configurationImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        false
      );
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );

      expect(getTableHarness().isLoading()).toBeTruthy();

      const skeleton =
        fixture.debugElement.nativeElement.querySelector("p-skeleton");
      expect(skeleton).toBeTruthy();
    });

    it("should show rows when loading is done", () => {
      component.selectedImpactIdsLoading.set(false);
      configurationImpactTableStateService.isLoading.set(false);
      configurationImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        false
      );
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );
      expect(getTableHarness().getValues()).toEqual(getConfigurationImpacts());

      const skeleton =
        fixture.debugElement.nativeElement.querySelector("p-skeleton");
      expect(skeleton).toBeFalsy();
    });

    it("should set the impact link on the title", () => {
      component.selectedImpactIdsLoading.set(false);
      configurationImpactTableStateService.isLoading.set(false);
      configurationImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        false
      );
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );
      fixture.detectChanges();

      const impactTitles = fixture.debugElement.queryAll(
        By.css('[data-testid="configuration-impact-title"]')
      );

      expect(impactTitles).toBeTruthy();
      expect(impactTitles.length).toBe(2);

      const firstRouterLinkInstance =
        impactTitles[0].injector.get(RouterLinkWithHref);
      const secondRouterLinkInstance =
        impactTitles[1].injector.get(RouterLinkWithHref);

      const firstLinkText = firstRouterLinkInstance.href;
      const secondLinkText = secondRouterLinkInstance.href;

      const expectedFirstLink = `/app/${PROJECT_ID}/detections/impacts/configuration/${
        getFirstConfigurationImpact().id
      }`;
      const expectedSecondLink = `/app/${PROJECT_ID}/detections/impacts/configuration/${
        getSecondConfigurationImpact().id
      }`;

      expect(firstLinkText).toBe(expectedFirstLink);
      expect(secondLinkText).toBe(expectedSecondLink);
    });

    it("should set the table loading state to true if isTableLoading is true", () => {
      component.selectedImpactIdsLoading.set(false);
      configurationImpactTableStateService.isLoading.set(true);
      configurationImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        false
      );
      expect(getTableHarness().isLoading()).toBe(true);
    });

    it("should set the table loading state to true if selectedImpactIdsLoading is true", () => {
      component.selectedImpactIdsLoading.set(true);
      configurationImpactTableStateService.isLoading.set(true);
      configurationImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        false
      );
      expect(getTableHarness().isLoading()).toBe(true);
    });

    it("should set the table loading state to true if isInitiallySelectedImpactsLoading is true", () => {
      component.selectedImpactIdsLoading.set(false);
      configurationImpactTableStateService.isLoading.set(false);
      configurationImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        true
      );
      expect(getTableHarness().isLoading()).toBe(true);
    });

    it("should set the table loading state to false if selectedImpactIdsLoading, isLoading and isInitiallySelectedImpactsLoading are false", () => {
      component.selectedImpactIdsLoading.set(false);
      configurationImpactTableStateService.isLoading.set(false);
      configurationImpactTableSelectionStateService.isInitiallySelectedImpactsLoading.set(
        false
      );
      expect(getTableHarness().isLoading()).toBe(false);
    });

    it("should bind configuration impacts to template correctly", () => {
      configurationImpactTableStateService.configurationImpacts.set(
        getConfigurationImpacts()
      );
      expect(getTableHarness().getValues()).toEqual(getConfigurationImpacts());
    });

    it("should bind total records to template correctly", () => {
      configurationImpactTableStateService.totalElements.set(12);
      expect(getTableHarness().getTotalRecords()).toEqual(12);
    });

    it("should bind isLoading to template correctly", () => {
      expect(getTableHarness().isLoading()).toBeFalsy();

      configurationImpactTableStateService.isLoading.set(true);
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
      configurationImpactTableStateService.isLoading.set(true);
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
      configurationImpactTableStateService.configurationImpacts.set([]);
      expect(getComponent(TableEmptyMessageComponent)).toBeTruthy();
    });
  });

  describe("template filters", () => {
    it("template owner phrase filter should be bound to ownerPhrase field", () => {
      fixture.detectChanges();
      const ownerColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="owner-column-filter"]')
      ).componentInstance as ColumnFilter;
      const ownerFieldName: keyof ConfigurationImpactTableQuery = "ownerPhrase";
      expect(ownerFieldName).toBeDefined();
      expect(ownerColumnFilter.field).toBe("ownerPhrase");
    });

    it("template title phrase filter should be bound to titlePhrases field", () => {
      fixture.detectChanges();
      const titleColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="title-column-filter"]')
      ).componentInstance as ColumnFilter;
      const titleFieldName: keyof ConfigurationImpactTableQuery = "titlePhrase";
      expect(titleFieldName).toBeDefined();
      expect(titleColumnFilter.field).toBe("titlePhrase");
    });

    it("template guilty change phrase filter should be bound to guiltyChangePhrases field", () => {
      fixture.detectChanges();
      const guiltyChangeColumnFilter = fixture.debugElement.query(
        By.css('[data-testid="guilty-change-column-filter"]')
      ).componentInstance as ColumnFilter;
      const guiltyChangeFieldName: keyof ConfigurationImpactTableQuery =
        "guiltyChangePhrase";
      expect(guiltyChangeFieldName).toBeDefined();
      expect(guiltyChangeColumnFilter.field).toBe("guiltyChangePhrase");
    });

    it("should trigger handleTableQueryParamsChange with the correct translated query when template filters change", () => {
      const handlerParamsChangeSpy = jest.spyOn(
        component,
        "handleTableQueryParamsChange"
      );
      const event: TableLazyLoadEvent = {
        first: 0,
        rows: 10,
        filters: { titlePhrase: { value: ["title1"] } },
      };
      const expectedQuery: ConfigurationImpactTableQuery = {
        page: 1,
        pageSize: 10,
        titlePhrase: "title1",
      };
      filterTranslator.handleTableFiltersChange.mockReturnValue(expectedQuery);
      getTableHarness().emitLazyLoadEvent(event);

      expect(handlerParamsChangeSpy).toHaveBeenCalledWith(event);
      expect(
        configurationImpactTableStateService.setConfigurationImpactsTableQuery
      ).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe("selected analysis objects", () => {
    it("should initialize the selected analysis object to empty array if none are selected", () => {
      component.initiallySelectedConfigurationImpacts = [];
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });

    it("should initialize the selected analysis object correctly if some initially selected", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedConfigurationImpacts = [
        {
          ...getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),

          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteConfigurationImpact>,
      ];
      configurationImpactTableSelectionStateService.initiallyConfigurationImpactSelectionStates.set(
        [
          {
            ...getFullySelectedConfigurationImpact(
              getFirstConfigurationImpact()
            ),
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<LiteConfigurationImpact>,
        ]
      );
      fixture.detectChanges();
      refresh$.next(true);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstConfigurationImpact().id,
          title: getFirstConfigurationImpact().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if none initially selected but added later", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedConfigurationImpacts = [];
      fixture.detectChanges();
      refresh$.next(true);
      component.selectedConfigurationImpacts.set([
        {
          ...getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteConfigurationImpact>,
      ]);
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstConfigurationImpact().id,
          title: getFirstConfigurationImpact().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should initialize the selected analysis object correctly if some initially selected and some added later", () => {
      const selectionMessage = "selection message";
      component.initiallySelectedConfigurationImpacts = [
        {
          ...getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as AnalysisObjectSelectionState<LiteConfigurationImpact>,
      ];
      configurationImpactTableSelectionStateService.initiallyConfigurationImpactSelectionStates.set(
        [
          {
            ...getFullySelectedConfigurationImpact(
              getFirstConfigurationImpact()
            ),
            selectionType: AnalysisObjectSelectionType.FULL,
            selectionMessage: selectionMessage,
          } as AnalysisObjectSelectionState<LiteConfigurationImpact>,
        ]
      );
      fixture.detectChanges();
      refresh$.next(true);
      component.selectedConfigurationImpacts.update((current) => {
        return [
          ...current,
          {
            ...getPartiallySelectedConfigurationImpact(
              getSecondConfigurationImpact()
            ),
            selectionType: AnalysisObjectSelectionType.PARTIAL,
          } as AnalysisObjectSelectionState<LiteConfigurationImpact>,
        ];
      });
      expect(component.selectedAnalysisObjects()).toEqual([
        {
          id: getFirstConfigurationImpact().id,
          title: getFirstConfigurationImpact().title,
          selectionType: AnalysisObjectSelectionType.FULL,
          selectionMessage: selectionMessage,
        } as SelectedAnalysisObject,
        {
          id: getSecondConfigurationImpact().id,
          title: getSecondConfigurationImpact().title,
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as SelectedAnalysisObject,
      ]);
    });

    it("should update selected configuration impacts when analysis object removed event is emitted", () => {
      component.selectedConfigurationImpacts.set([
        {
          ...getPartiallySelectedConfigurationImpact(
            getFirstConfigurationImpact()
          ),
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as AnalysisObjectSelectionState<LiteConfigurationImpact>,
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstConfigurationImpact().id);
      expect(component.selectedConfigurationImpacts()).toEqual([]);
    });
    it("should update selected analysis objects when analysis object removed event is emitted", () => {
      component.selectedConfigurationImpacts.set([
        {
          ...getFullySelectedConfigurationImpact(getFirstConfigurationImpact()),
          selectionType: AnalysisObjectSelectionType.PARTIAL,
        } as AnalysisObjectSelectionState<LiteConfigurationImpact>,
      ]);
      getComponent(
        SelectedAnalysisObjectsListingComponent
      ).analysisObjectRemoved.emit(getFirstConfigurationImpact().id);
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });
  });

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(
      fixture,
      "configuration-impacts-selection-table"
    );
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});

function getConfigurationImpacts(): LiteConfigurationImpact[] {
  return [getFirstConfigurationImpact(), getSecondConfigurationImpact()];
}

function getFirstConfigurationImpact(): LiteConfigurationImpact {
  return {
    id: ID_1,
    projectId: PROJECT_ID,
    title: "title1",
    owner: "owner1",
    guiltyChange: "guiltyChange1",
  };
}

function getSecondConfigurationImpact(): LiteConfigurationImpact {
  return {
    id: "2",
    projectId: "projectId",
    title: "title2",
    owner: "owner2",
    guiltyChange: "guiltyChange2",
  };
}

function getCheckedConfigurationImpactTableRowSelectionState(): ConfigurationImpactTableRowSelectionState {
  return {
    selectionState: {
      checked: true,
      partialSelected: false,
    },
  };
}

function getPartiallyCheckedConfigurationImpactTableRowSelectionState(): ConfigurationImpactTableRowSelectionState {
  return {
    selectionState: {
      checked: false,
      partialSelected: true,
    },
  };
}

function getUncheckedConfigurationImpactTableRowSelectionState(): ConfigurationImpactTableRowSelectionState {
  return {
    selectionState: {
      checked: false,
      partialSelected: false,
    },
  };
}

function getUncheckedConfigurationImpactTableRowSelectionStates(
  configurationImpacts: LiteConfigurationImpact[]
): Map<string, ConfigurationImpactTableRowSelectionState> {
  return new Map<string, ConfigurationImpactTableRowSelectionState>(
    configurationImpacts.map((configurationImpact) => [
      configurationImpact.id,
      getUncheckedConfigurationImpactTableRowSelectionState(),
    ])
  );
}

function getFullySelectedConfigurationImpact(
  configurationImpact: LiteConfigurationImpact
): AnalysisObjectSelectionState<LiteConfigurationImpact> {
  return {
    analysisObject: configurationImpact,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

function getFullySelectedConfigurationImpacts(
  configurationImpacts: LiteConfigurationImpact[]
): AnalysisObjectSelectionState<LiteConfigurationImpact>[] {
  return configurationImpacts.map((configurationImpact) =>
    getFullySelectedConfigurationImpact(configurationImpact)
  );
}

function getPartiallySelectedConfigurationImpact(
  configurationImpact: LiteConfigurationImpact
): AnalysisObjectSelectionState<LiteConfigurationImpact> {
  return {
    analysisObject: configurationImpact,
    selectionType: AnalysisObjectSelectionType.PARTIAL,
  };
}
