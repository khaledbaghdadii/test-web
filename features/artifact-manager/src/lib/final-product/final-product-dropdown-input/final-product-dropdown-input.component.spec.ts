import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { FinalProductDropdownInputComponent } from "./final-product-dropdown-input.component";
import { FinalProductDropdownStateService } from "./final-product-dropdown-state.service";
import { FinalProductDropdownOption } from "./final-product-dropdown-option.model";
import { signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { InputTextModule } from "primeng/inputtext";
import { FinalProduct } from "../model/final-product";
import { DropdownDefaultSelectionMode } from "../model/dropdown-default-selection-mode";
import { Select, SelectChangeEvent, SelectModule } from "primeng/select";
import { FormatDatePipe } from "@mxflow/pipe";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FinalProductDropdownInputLabelMode } from "@mxflow/features/artifact-manager";

const PROJECT_ID = "projectId";
const BRANCH = "branch";
const FIRST_FINAL_PRODUCT = {
  id: "firstFinalProductId",
  projectId: "firstProjectId",
  branch: "firstBranch",
  repositoryId: "firstRepositoryId",
  tag: "firstTag",
  configurationCommitId: "firstConfigurationCommitId",
  expiryDate: new Date(),
} as unknown as FinalProduct;

const SECOND_FINAL_PRODUCT = {
  id: "secondFinalProductId",
  projectId: "secondProjectId",
  branch: "secondBranch",
  repositoryId: "secondRepositoryId",
  tag: "secondTag",
  configurationCommitId: "secondConfigurationCommitId",
} as unknown as FinalProduct;

const FORMATTED_DATE = new Date();
const FINAL_PRODUCT_DROPDOWN_OPTIONS: FinalProductDropdownOption[] = [
  {
    label: FIRST_FINAL_PRODUCT.configurationCommitId,
    value: FIRST_FINAL_PRODUCT,
  },
  {
    label: SECOND_FINAL_PRODUCT.configurationCommitId,
    value: SECOND_FINAL_PRODUCT,
  },
];

const SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS: FinalProductDropdownOption[] = [
  {
    label: SECOND_FINAL_PRODUCT.configurationCommitId,
    value: SECOND_FINAL_PRODUCT,
  },
];

describe("FinalProductDropdownInputComponent", () => {
  let component: FinalProductDropdownInputComponent;
  let fixture: ComponentFixture<FinalProductDropdownInputComponent>;
  let mockStateService: any;
  let mockFormatDatePipe: any;
  beforeEach(async () => {
    mockStateService = {
      setProjectId: jest.fn(),
      setPageIndex: jest.fn(),
      setBranchCriteria: jest.fn(),
      setFetchParent: jest.fn(),
      setValidationLevel: jest.fn(),
      setDropdownLabelMode: jest.fn(),
      setSelectedOption: jest.fn(),
      setSearchKey: jest.fn(),
      setLastFetchedElement: jest.fn(),
      setCustomFinalProductId: jest.fn(),
      setDropdownDefaultSelectionMode: jest.fn(),
      setRepositoryId: jest.fn(),
      errorMessage: signal(undefined),
      finalProductDropdownOptions: signal(undefined),
      searchKey: signal(undefined),
      isLastPage: signal(false),
      isLoadingData: signal(false),
      lastFetchedElement: signal(-1),
      pageIndex: signal(0),
      dropdownDefaultSelectionModeSignal: signal(
        DropdownDefaultSelectionMode.LATEST
      ),
      customFinalProduct: signal(undefined),
      dropdownHeight: signal("200px"),
      selectedOption: signal({
        label: FIRST_FINAL_PRODUCT.configurationCommitId,
        value: FIRST_FINAL_PRODUCT,
      } as FinalProductDropdownOption),
    };

    mockFormatDatePipe = {
      transform: jest.fn(() => FORMATTED_DATE),
    };

    await TestBed.configureTestingModule({
      imports: [
        FinalProductDropdownInputComponent,
        SelectModule,
        FormsModule,
        CommonModule,
        InputTextModule,
        NoopAnimationsModule,
      ],
    })
      .overrideComponent(FinalProductDropdownInputComponent, {
        set: {
          providers: [
            {
              provide: FinalProductDropdownStateService,
              useValue: mockStateService,
            },
            {
              provide: FormatDatePipe,
              useValue: mockFormatDatePipe,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FinalProductDropdownInputComponent);
    component = fixture.componentInstance;
    initializeInputs();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("initialization", () => {
    it("should set the projectId on input change", () => {
      expect(mockStateService.setProjectId).toHaveBeenCalledWith(PROJECT_ID);
      fixture.componentRef.setInput("projectId", "projectId2");
      fixture.detectChanges();
      expect(mockStateService.setProjectId).toHaveBeenCalledWith("projectId2");
    });

    it("should set validation on input change", () => {
      fixture.componentRef.setInput("validationLevel", "MQG");
      fixture.detectChanges();
      expect(mockStateService.setValidationLevel).toHaveBeenCalledWith("MQG");
    });

    it("should have undefined validation level by default", () => {
      fixture.detectChanges();

      expect(component.validationLevel).toBeUndefined();
    });

    it("should have commit id label mode by default", () => {
      fixture.detectChanges();
      expect(component.labelMode()).toBe(
        FinalProductDropdownInputLabelMode.COMMIT_ID
      );
    });

    it("should set the index to zero on projectId input change", () => {
      fixture.componentRef.setInput("projectId", "new project id");
      expect(mockStateService.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("should reset the LastFetchedElement on projectId input change", () => {
      fixture.componentRef.setInput("projectId", "new project id");
      expect(mockStateService.setLastFetchedElement).toHaveBeenCalledWith(-1);
    });

    it("should set the branch on input change", () => {
      expect(mockStateService.setBranchCriteria).toHaveBeenCalledWith(BRANCH);

      fixture.componentRef.setInput("branchFilter", "newBranch");
      fixture.detectChanges();
      expect(mockStateService.setBranchCriteria).toHaveBeenCalledWith(
        "newBranch"
      );
    });

    it("should set the index to zero on branch filter input change", () => {
      fixture.componentRef.setInput("branchFilter", "new branch");
      expect(mockStateService.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("should default the fetch parent input to undefined", () => {
      fixture.detectChanges();

      expect(component.fetchParent).toBeUndefined();
    });

    it("should set fetchParent when fetchParent input changes", () => {
      fixture.componentRef.setInput("fetchParent", true);
      fixture.detectChanges();

      expect(mockStateService.setFetchParent).toHaveBeenCalledWith(true);
    });

    it("should reset the lastFetchedElement on branch filter input change", () => {
      fixture.componentRef.setInput("branchFilter", "new branch");
      expect(mockStateService.setLastFetchedElement).toHaveBeenCalledWith(-1);
    });

    it("should set the repository id on input change", () => {
      fixture.componentRef.setInput("repositoryId", "repo-id-1");
      fixture.detectChanges();

      expect(mockStateService.setRepositoryId).toHaveBeenCalledWith(
        "repo-id-1"
      );
    });

    it("should update repository id when input changes", () => {
      fixture.componentRef.setInput("repositoryId", "repo-id-1");
      fixture.detectChanges();
      expect(mockStateService.setRepositoryId).toHaveBeenCalledWith(
        "repo-id-1"
      );

      fixture.componentRef.setInput("repositoryId", "repo-id-2");
      fixture.detectChanges();
      expect(mockStateService.setRepositoryId).toHaveBeenCalledWith(
        "repo-id-2"
      );
    });

    it("should emit error message on error", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.errorMessageChange, "emit");
      mockStateService.errorMessage.set("errorMessage");
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledWith("errorMessage");
    }));

    it("should do nothing if error message is undefined", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.errorMessageChange, "emit");
      mockStateService.errorMessage.set(undefined);
      tick();
      expect(emitSpy).not.toHaveBeenCalled();
    }));

    it("should emit selected option and expiryDate notification on selection observable change", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.selectedFinalProductChange, "emit");
      const emitExpiryDateSpy = jest.spyOn(
        component.selectedFinalProductExpiryDateNotification,
        "emit"
      );
      mockStateService.selectedOption.set(FINAL_PRODUCT_DROPDOWN_OPTIONS[0]);
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledWith(FIRST_FINAL_PRODUCT);
      expect(emitExpiryDateSpy).toHaveBeenCalledWith(
        `The selected final product will expire on ${FORMATTED_DATE}`
      );
      expect(mockFormatDatePipe.transform).toHaveBeenCalledWith(
        FIRST_FINAL_PRODUCT.expiryDate
      );
    }));

    it("should not emit expiryDate notification when final product has no expiry date", fakeAsync(() => {
      const emitExpiryDateSpy = jest.spyOn(
        component.selectedFinalProductExpiryDateNotification,
        "emit"
      );
      mockStateService.selectedOption.set(FINAL_PRODUCT_DROPDOWN_OPTIONS[1]);
      tick();
      expect(emitExpiryDateSpy).not.toHaveBeenCalled();
    }));

    it("should not emit expiryDate notification when selected final product is undefined", fakeAsync(() => {
      const emitExpiryDateSpy = jest.spyOn(
        component.selectedFinalProductExpiryDateNotification,
        "emit"
      );
      mockStateService.selectedOption.set(undefined);
      tick();
      expect(emitExpiryDateSpy).not.toHaveBeenCalled();
    }));

    it("should emit data ready values on change", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.dataReadyChange, "emit");
      mockStateService.isLoadingData.set(true);
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledWith(false);
    }));

    it("should should skip the first false values of isLoadingData", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.dataReadyChange, "emit");
      mockStateService.isLoadingData.set(false);
      fixture.detectChanges();
      tick();
      mockStateService.isLoadingData.set(false);
      fixture.detectChanges();
      tick();
      mockStateService.isLoadingData.set(true);
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(false);
    }));

    it("should emit the subsequent first values of isLoadingData", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.dataReadyChange, "emit");
      mockStateService.isLoadingData.set(true);
      fixture.detectChanges();
      tick();
      mockStateService.isLoadingData.set(false);
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledTimes(2);
    }));

    describe("auto-select", () => {
      it.each([undefined, null])(
        "should clear selection when dropdownDefaultSelectionMode is set to CUSTOM and customFinalProduct does not exist",
        fakeAsync((customFinalProduct: FinalProduct) => {
          const event = { value: customFinalProduct } as SelectChangeEvent;
          const pDropdownElement = fixture.debugElement.query(
            By.directive(Select)
          );
          const pDropdownInstance =
            pDropdownElement.componentInstance as Select;
          pDropdownInstance.onChange.emit(event);
          mockStateService.dropdownDefaultSelectionModeSignal.set(
            DropdownDefaultSelectionMode.CUSTOM
          );
          fixture.detectChanges();
          tick();

          expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
            undefined
          );
        })
      );

      it.each([
        DropdownDefaultSelectionMode.CUSTOM,
        DropdownDefaultSelectionMode.LATEST,
      ])(
        "should auto-select first option on init",
        fakeAsync(
          (dropdownDefaultSelectionMode: DropdownDefaultSelectionMode) => {
            mockStateService.finalProductDropdownOptions.set(
              FINAL_PRODUCT_DROPDOWN_OPTIONS
            );
            mockStateService.dropdownDefaultSelectionModeSignal.set(
              dropdownDefaultSelectionMode
            );
            tick();
            fixture.detectChanges();
            expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
              FINAL_PRODUCT_DROPDOWN_OPTIONS[0]
            );
            const selectionSpan = fixture.debugElement.query(
              By.css('[data-testid="selectedFinalProduct"]')
            );
            expect(selectionSpan).toBeTruthy();
            expect(selectionSpan.nativeElement.textContent).toContain(
              FINAL_PRODUCT_DROPDOWN_OPTIONS[0].label
            );
            mockStateService.setSelectedOption.mockClear();
            mockStateService.finalProductDropdownOptions.set(
              SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS
            );
            tick();
            expect(mockStateService.setSelectedOption).not.toHaveBeenCalled();
          }
        )
      );

      it.each([undefined, null, []])(
        "should show selection if options is empty but selectedFinalProduct exists",
        fakeAsync((invalidOptions: any) => {
          mockStateService.setSelectedOption.mockClear();
          component.selectedOption = signal({
            label: FIRST_FINAL_PRODUCT.configurationCommitId,
            value: FIRST_FINAL_PRODUCT,
          });
          mockStateService.finalProductDropdownOptions.set(invalidOptions);
          expect(mockStateService.setSelectedOption).not.toHaveBeenCalled();

          mockStateService.finalProductDropdownOptions.set(
            FINAL_PRODUCT_DROPDOWN_OPTIONS
          );
          tick();
          fixture.detectChanges();
          const selectionSpan = fixture.debugElement.query(
            By.css('[data-testid="selectedFinalProduct"]')
          );
          expect(selectionSpan).toBeTruthy();
          expect(selectionSpan.nativeElement.textContent).toContain(
            FIRST_FINAL_PRODUCT.configurationCommitId
          );
          expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
            FINAL_PRODUCT_DROPDOWN_OPTIONS[0]
          );
        })
      );

      it.each([undefined, null, []])(
        "should only auto-select on the first truthy emission",
        fakeAsync((invalidOptions: any) => {
          mockStateService.setSelectedOption.mockClear();
          component.selectedOption = signal(undefined);
          mockStateService.finalProductDropdownOptions.set(invalidOptions);
          expect(mockStateService.setSelectedOption).not.toHaveBeenCalled();

          mockStateService.finalProductDropdownOptions.set(
            FINAL_PRODUCT_DROPDOWN_OPTIONS
          );
          tick();
          fixture.detectChanges();
          const selectionSpan = fixture.debugElement.query(
            By.css('[data-testid="selectedFinalProduct"]')
          );
          expect(selectionSpan).toBeFalsy();
          expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
            FINAL_PRODUCT_DROPDOWN_OPTIONS[0]
          );
        })
      );
    });
  });
  describe("ngOnInit", () => {
    it("should set the dropdown label mode to commit id in state service", () => {
      component.ngOnInit();
      expect(mockStateService.setDropdownLabelMode).toHaveBeenCalledWith(
        FinalProductDropdownInputLabelMode.COMMIT_ID
      );
    });

    it.each([
      FinalProductDropdownInputLabelMode.TAG,
      FinalProductDropdownInputLabelMode.TAG_COMMIT_ID,
    ])("should set the dropdown label mode on input change", (labelMode) => {
      fixture.componentRef.setInput("labelMode", labelMode);
      component.ngOnInit();
      expect(mockStateService.setDropdownLabelMode).toHaveBeenCalledWith(
        labelMode
      );
    });
  });
  describe("reading signals from state service", () => {
    it("should read the finalProductDropdownOptions signal from the state service", () => {
      mockStateService.finalProductDropdownOptions.set(
        FINAL_PRODUCT_DROPDOWN_OPTIONS
      );
      expect(component.finalProductDropdownOptions()).toEqual(
        FINAL_PRODUCT_DROPDOWN_OPTIONS
      );
    });

    it("should bind finalProductDropdownOptions to the dropdown options in the template", () => {
      mockStateService.finalProductDropdownOptions.set(
        FINAL_PRODUCT_DROPDOWN_OPTIONS
      );
      fixture.detectChanges();
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;
      expect(pDropdownInstance.options).toEqual(FINAL_PRODUCT_DROPDOWN_OPTIONS);
    });

    it("should read the isLastPage signal from the state service", () => {
      mockStateService.isLastPage.set(true);
      expect(component.isLastPage).toBeTruthy();
    });

    it("should read selected option from state service", () => {
      mockStateService.selectedOption.set(FINAL_PRODUCT_DROPDOWN_OPTIONS[0]);
      expect(component.selectedOption()).toEqual(
        FINAL_PRODUCT_DROPDOWN_OPTIONS[0]
      );
    });

    it("should bind selectedOption to the dropdown ngModel in the template", () => {
      mockStateService.selectedOption.set(FINAL_PRODUCT_DROPDOWN_OPTIONS[0]);
      fixture.detectChanges();
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;
      expect(pDropdownInstance.hasSelectedOption()).toBeTruthy();
    });

    it("should read searchKey from the state service", () => {
      mockStateService.searchKey.set(FIRST_FINAL_PRODUCT.configurationCommitId);
      expect(component.searchKey()).toEqual(
        FIRST_FINAL_PRODUCT.configurationCommitId
      );
    });

    it("should read last fetched element from state service", () => {
      mockStateService.lastFetchedElement.set(1);
      expect(component.lastFetchedElement()).toEqual(1);
    });

    it("should read page index from state service", () => {
      mockStateService.pageIndex.set(1);
      expect(component.pageIndex()).toEqual(1);
    });

    it("should read is loading data from state service", () => {
      mockStateService.isLoadingData.set(true);
      expect(component.isLoadingData()).toBeTruthy();
    });
  });

  describe("handleScroll", () => {
    beforeEach(() => {
      mockStateService.setPageIndex.mockClear();
      mockStateService.setLastFetchedElement.mockClear();
    });

    it("should do nothing if first is undefined", () => {
      component.handleScroll({ first: undefined, last: 0 });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it("should do nothing if last is undefined", () => {
      component.handleScroll({ first: 0, last: undefined });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it("should do nothing if it is the last page", () => {
      mockStateService.isLastPage.set(true);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it.each([10, 15])(
      "should do nothing if lastFetchedElement is greater than or equal to the current last",
      (lastFetchedElement) => {
        mockStateService.isLastPage.set(false);
        mockStateService.lastFetchedElement.set(lastFetchedElement);
        component.handleScroll({ first: 5, last: 10 });
        expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
        expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
      }
    );

    it("should do nothing if the user is more than one step away from the next page", () => {
      component.handleScroll({ first: 0, last: 5 });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it("should do nothing if the data is loading", () => {
      mockStateService.isLoadingData.set(true);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it("should set the page index if the user is less than one step away from the last fetched page", () => {
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndex).toHaveBeenCalled();
    });

    it("should increment the page index if the next page should be loaded", () => {
      mockStateService.pageIndex.set(0);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndex).toHaveBeenCalledWith(1);
    });

    it("should update the last fetched element signal if the next page should be loaded", () => {
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setLastFetchedElement).toHaveBeenCalledWith(10);
    });
  });

  describe("handleFinalProductSelected", () => {
    it("should set the selected final product", () => {
      const event = { value: FIRST_FINAL_PRODUCT } as SelectChangeEvent;
      component.handleFinalProductSelected(event);
      expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
        FINAL_PRODUCT_DROPDOWN_OPTIONS[0]
      );
    });

    it("should call handleFinalProductSelected on change", () => {
      const handlerSpy = jest.spyOn(component, "handleFinalProductSelected");
      const event = { value: FIRST_FINAL_PRODUCT } as SelectChangeEvent;
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;

      pDropdownInstance.onChange.emit(event);
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalled();
    });
  });

  describe("handleSearchKeyInputChange", () => {
    it("should set the search key", () => {
      component.handleSearchKeyInputChange("commitId");
      expect(mockStateService.setSearchKey).toHaveBeenCalledWith("commitId");
    });

    it("should reset the page index", () => {
      component.handleSearchKeyInputChange("commitId");
      expect(mockStateService.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("should reset the lastFetchedElement", () => {
      component.handleSearchKeyInputChange("commitId");
      expect(mockStateService.setLastFetchedElement).toHaveBeenCalledWith(-1);
    });
  });

  describe("clearSearchKey", () => {
    it("should reset search key criteria", () => {
      const stopAction = jest.fn();
      component.clearSearchKey({ stopPropagation: stopAction });
      expect(mockStateService.setSearchKey).toHaveBeenCalledWith(undefined);
    });

    it("should reset the page index", () => {
      mockStateService.setPageIndex.mockClear();
      const stopAction = jest.fn();
      component.clearSearchKey({ stopPropagation: stopAction });
      expect(mockStateService.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("should reset the lastFetchedElement", () => {
      component.handleSearchKeyInputChange("commitId");
      expect(mockStateService.setLastFetchedElement).toHaveBeenCalledWith(-1);
    });
  });

  describe("clear selected option", () => {
    it("should clear selected option on dropdown clear", () => {
      mockStateService.selectedOption.set(FINAL_PRODUCT_DROPDOWN_OPTIONS[0]);

      component.clearSelectedOption();

      expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
        undefined
      );
    });
  });

  function initializeInputs() {
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("branchFilter", BRANCH);
    mockStateService.setPageIndex.mockClear();
    mockStateService.setLastFetchedElement.mockClear();
  }
});
