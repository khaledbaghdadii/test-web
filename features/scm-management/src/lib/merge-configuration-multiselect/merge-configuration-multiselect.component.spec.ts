import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { InputTextModule } from "primeng/inputtext";
import { By } from "@angular/platform-browser";
import { MergeConfiguration } from "../merge-configuration/model/merge-configuration";
import { MergeConfigurationMultiSelectComponent } from "./merge-configuration-multiselect.component";
import { MultiSelect, MultiSelectModule } from "primeng/multiselect";
import { MergeConfigurationMultiSelectStateService } from "./state-service/merge-configuration-multiselect-state.service";

const SEARCH_KEY = "SEARCH_KEY";
const PROJECT_ID = "PROJECT_ID";
const BRANCH_NAME = "BRANCH_NAME";
const MERGE_CONFIGURATION_ID_1 = "MERGE_CONFIGURATION_ID_1";
const MERGE_CONFIGURATION_ID_2 = "MERGE_CONFIGURATION_ID_2";
const FIRST_MERGE_CONFIGURATION: MergeConfiguration = {
  id: MERGE_CONFIGURATION_ID_1,
  projectId: PROJECT_ID,
  branchName: BRANCH_NAME,
  mergeConfigurationDefinition: {
    id: "def-1",
    repositoryId: "repoId",
  },
};
const SECOND_MERGE_CONFIGURATION: MergeConfiguration = {
  id: MERGE_CONFIGURATION_ID_2,
  projectId: PROJECT_ID,
  branchName: BRANCH_NAME,
  mergeConfigurationDefinition: {
    id: "def-2",
    repositoryId: "repoId",
  },
};

describe("MergeConfigurationMultiSelectComponent", () => {
  let component: MergeConfigurationMultiSelectComponent;
  let fixture: ComponentFixture<MergeConfigurationMultiSelectComponent>;
  let mockStateService: any;

  beforeEach(async () => {
    mockStateService = {
      setPageIndexSubject: jest.fn(),
      setSearchKeySubject: jest.fn(),
      mergeConfigurationsSignal: signal([]),
      isLastPageSignal: signal(false),
      isLoadingDataSignal: signal(true),
      pageIndexSignal: signal(0),
      searchKeySignal: signal(undefined),
      errorMessageSignal: signal(""),
    };

    await TestBed.configureTestingModule({
      imports: [
        MergeConfigurationMultiSelectComponent,
        MultiSelectModule,
        FormsModule,
        CommonModule,
        InputTextModule,
      ],
    })
      .overrideComponent(MergeConfigurationMultiSelectComponent, {
        set: {
          providers: [
            {
              provide: MergeConfigurationMultiSelectStateService,
              useValue: mockStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MergeConfigurationMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("function Object() { [native code] }", () => {
    it("should emit error on error observable change", fakeAsync(() => {
      const errorMessage = "ERROR MESSAGE";
      const emitSpy = jest.spyOn(component.errorEventEmitter, "emit");
      mockStateService.errorMessageSignal.set(errorMessage);
      fixture.detectChanges();
      expect(emitSpy).toHaveBeenCalledWith(errorMessage);
    }));

    it("should emit loading finished event on is loading observable change to false", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.loadingFinishedEventEmitter, "emit");
      mockStateService.isLoadingDataSignal.set(false);
      fixture.detectChanges();
      expect(emitSpy).toHaveBeenCalled();
    }));
  });

  describe("reading signals from state service", () => {
    it("should read the errorMessageSignal signal from the state service", () => {
      mockStateService.errorMessageSignal.set("errorMessageSignal");
      expect(component.errorMessageSignal()).toEqual("errorMessageSignal");
    });

    it("should bind mergeConfigurationsSignal to the multiselect options in the template", () => {
      mockStateService.mergeConfigurationsSignal.set([
        FIRST_MERGE_CONFIGURATION,
        SECOND_MERGE_CONFIGURATION,
      ]);
      fixture.detectChanges();
      const pMultiSelectElement = fixture.debugElement.query(
        By.directive(MultiSelect)
      );
      const pMultiSelectedInstance =
        pMultiSelectElement.componentInstance as MultiSelect;
      expect(pMultiSelectedInstance.options).toEqual([
        FIRST_MERGE_CONFIGURATION,
        SECOND_MERGE_CONFIGURATION,
      ]);
    });

    it("should read the isLastPageSignal signal from the state service", () => {
      mockStateService.isLastPageSignal.set(true);
      expect(component.isLastPageSignal).toBeTruthy();
    });

    it("should read isLoadingDataSignal from state service", () => {
      mockStateService.isLoadingDataSignal.set(true);
      expect(component.isLoadingDataSignal()).toEqual(true);
    });

    it("should bind selectedMergeConfigurations to the multiselect formcontrol in the template", () => {
      component.selectedMergeConfigurations.setValue([
        FIRST_MERGE_CONFIGURATION,
        SECOND_MERGE_CONFIGURATION,
      ]);
      fixture.detectChanges();
      const pMultiSelectElement = fixture.debugElement.query(
        By.directive(MultiSelect)
      );
      const pMultiSelectInstance =
        pMultiSelectElement.componentInstance as MultiSelect;
      expect(pMultiSelectInstance.hasSelectedOption()).toBeTruthy();
    });

    it("should read searchKeySignal from the state service", () => {
      mockStateService.searchKeySignal.set(SEARCH_KEY);
      expect(component.searchKeySignal()).toEqual(SEARCH_KEY);
    });

    it("should read pageIndexSignal from state service", () => {
      mockStateService.pageIndexSignal.set(1);
      expect(component.pageIndexSignal()).toEqual(1);
    });
  });

  describe("handleScroll", () => {
    it("should do nothing if first is undefined", () => {
      component.handleScroll({ first: undefined, last: 0 });
      expect(mockStateService.setPageIndexSubject).not.toHaveBeenCalled();
    });

    it("should do nothing if last is undefined", () => {
      component.handleScroll({ first: 0, last: undefined });
      expect(mockStateService.setPageIndexSubject).not.toHaveBeenCalled();
    });

    it("should do nothing if it is the last page", () => {
      mockStateService.isLastPageSignal.set(true);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndexSubject).not.toHaveBeenCalled();
    });

    it("should do nothing if the user is more than one step away from the next page", () => {
      component.handleScroll({ first: 0, last: 5 });
      expect(mockStateService.setPageIndexSubject).not.toHaveBeenCalled();
    });

    it("should do nothing if the data is loading", () => {
      mockStateService.isLoadingDataSignal.set(true);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndexSubject).not.toHaveBeenCalled();
    });

    it("should set the page index if the user is less than one step away from the last fetched page", () => {
      mockStateService.isLastPageSignal.set(false);
      mockStateService.isLoadingDataSignal.set(false);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndexSubject).toHaveBeenCalledWith(1);
    });
  });

  describe("handleSearchKeyChange", () => {
    it("should set searchkey", () => {
      component.handleSearchKeyChange(SEARCH_KEY);
      expect(mockStateService.setSearchKeySubject).toHaveBeenCalledWith(
        SEARCH_KEY
      );
    });

    it("should reset the page index", () => {
      component.handleSearchKeyChange(SEARCH_KEY);
      expect(mockStateService.setPageIndexSubject).toHaveBeenCalledWith(0);
    });
  });

  describe("clearSearchKey", () => {
    it("should reset the page index", () => {
      mockStateService.setPageIndexSubject.mockClear();
      mockStateService.searchKeySignal.set("test");
      const stopAction = jest.fn();
      component.handleClearSearchKey({ stopPropagation: stopAction });
      expect(mockStateService.setPageIndexSubject).toHaveBeenCalledWith(0);
    });
  });
});
