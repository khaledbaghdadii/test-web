import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { DefectSelectionTableComponent } from "./defect-selection-table.component";
import { CommonModule } from "@angular/common";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  FilterTranslatorService,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { DefectTableStateService } from "./defect-table-state.service";
import { signal } from "@angular/core";
import { Defect } from "../model/defect.model";
import { By } from "@angular/platform-browser";
import { DefectTableQuery } from "./defect-table-query.model";
import { ValidationScope } from "@mxflow/features/validation-management";
import { DomTestUtils } from "@mxevolve/testing";

const FIRST_DEFECT: Defect = {
  id: "defect1",
  link: "/defect1",
  title: "Defect 1",
  description: "description1",
  submissionDate: new Date(),
  developer: "3amo sami",
};

const SECOND_DEFECT: Defect = {
  id: "defect2",
  link: "/defect2",
  title: "Defect 2",
  description: "description2",
  submissionDate: new Date(),
  developer: "3amo may",
};

const DEFECT_TABLE_QUERY: DefectTableQuery = {
  page: 0,
  pageSize: 10,
  idPhrase: "idPhrase",
  titlePhrase: "titlePhrase",
  descriptionPhrase: "descriptionPhrase",
  developerPhrase: "developerPhrase",
};

const VALIDATION_SCOPE: ValidationScope = {
  currentVersion: "currentVersion",
  referenceVersion: "referenceVersion",
};

describe("DefectSelectionTableComponent", () => {
  let component: DefectSelectionTableComponent;
  let fixture: ComponentFixture<DefectSelectionTableComponent>;
  let mockStateService: any;
  let filterTranslator: FilterTranslatorService;

  beforeEach(waitForAsync(() => {
    mockStateService = {
      defects: signal<Defect[]>([FIRST_DEFECT, SECOND_DEFECT]),
      totalElements: signal<number>(0),
      page: signal<number>(0),
      pageSize: signal<number>(10),
      errorMessage: signal<string | undefined>(undefined),
      warningMessage: signal<string | undefined>(undefined),
      isLoading: signal<boolean>(false),
      setDefectTableQuery: jest.fn(),
      setValidationScope: jest.fn(),
      setIsVisible: jest.fn(),
    };

    filterTranslator = {
      handleTableFiltersChange: jest.fn(() => DEFECT_TABLE_QUERY),
    } as unknown as FilterTranslatorService;

    TestBed.configureTestingModule({
      imports: [
        DefectSelectionTableComponent,
        CommonModule,
        HeaderTitleModule,
        SkeletonModule,
        TableEmptyMessageComponent,
        TableModule,
        TooltipModule,
      ],
    })
      .overrideComponent(DefectSelectionTableComponent, {
        set: {
          providers: [
            {
              provide: DefectTableStateService,
              useValue: mockStateService,
            },
            {
              provide: FilterTranslatorService,
              useValue: filterTranslator,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DefectSelectionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("reading signals from state service", () => {
    it("should compute index of the first table row from page index and size", () => {
      mockStateService.page.set(2);
      mockStateService.pageSize.set(10);
      expect(component.firstRowIndex()).toEqual(20);
    });

    it("should read defects from state service", () => {
      mockStateService.defects.set([FIRST_DEFECT, SECOND_DEFECT]);
      expect(component.defects()).toEqual([FIRST_DEFECT, SECOND_DEFECT]);
    });

    it("should read total records from state service", () => {
      mockStateService.totalElements.set(12);
      expect(component.totalRecords()).toEqual(12);
    });

    it("should read errorMessage from state service", () => {
      mockStateService.errorMessage.set("failed");
      expect(component.errorMessage()).toEqual("failed");
    });

    it("should read isloading from state service", () => {
      mockStateService.isLoading.set(true);
      expect(component.isLoading()).toBeTruthy();
    });

    it("should read warningMessage from state service", () => {
      mockStateService.warningMessage.set("warning");
      expect(component.warningMessage()).toEqual("warning");
    });
  });

  describe("inputs", () => {
    it("should set validation scope criteria when validation scope input changes", () => {
      fixture.componentRef.setInput("validationScope", VALIDATION_SCOPE);
      expect(mockStateService.setValidationScope).toHaveBeenCalledWith(
        VALIDATION_SCOPE
      );
      const newValidationScope = {
        ...VALIDATION_SCOPE,
        referenceVersion: undefined,
      };
      fixture.componentRef.setInput("validationScope", newValidationScope);
      expect(mockStateService.setValidationScope).toHaveBeenCalledWith(
        newValidationScope
      );
    });

    it("should set isVisible when isVisible input changes", () => {
      fixture.componentRef.setInput("isVisible", false);
      expect(mockStateService.setIsVisible).toHaveBeenCalledWith(false);
      fixture.componentRef.setInput("isVisible", true);
      expect(mockStateService.setIsVisible).toHaveBeenCalledWith(true);
    });
  });

  describe("function Object() { [native code] }", () => {
    it("should emit error message on error message change", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.errorMessageChange, "emit");
      mockStateService.errorMessage.set("errorMessage");
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledWith("errorMessage");
    }));

    it("should do nothing if error message is undefined", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.errorMessageChange, "emit");
      mockStateService.errorMessage.set("errorMessage");
      fixture.detectChanges();
      tick();
      mockStateService.errorMessage.set(undefined);
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith("errorMessage");
    }));

    it("should emit warning message on change", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.warningMessageChange, "emit");
      mockStateService.warningMessage.set("warningMessage");
      tick();
      fixture.detectChanges();
      expect(emitSpy).toHaveBeenCalledWith("warningMessage");
    }));

    it("should emit the warning message if it is undefined", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.warningMessageChange, "emit");
      mockStateService.warningMessage.set("warningMessage");
      tick();
      fixture.detectChanges();
      mockStateService.warningMessage.set(undefined);
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenCalledWith("warningMessage");
      expect(emitSpy).toHaveBeenCalledWith(undefined);
    }));
  });

  describe("handleTableQueryParamsChange", () => {
    it("should translate the filters to a defect table query", () => {
      component.handleTableQueryParamsChange({ first: 11, rows: 10 });
      expect(filterTranslator.handleTableFiltersChange).toHaveBeenCalled();
    });

    it("should update the defect query with the new filters", () => {
      component.handleTableQueryParamsChange({ first: 11, rows: 10 });
      expect(mockStateService.setDefectTableQuery).toHaveBeenCalled();
    });
  });

  describe("template binding", () => {
    it("should bind defects to template correctly", () => {
      mockStateService.defects.set([FIRST_DEFECT, SECOND_DEFECT]);
      expect(getTableHarness().getValues()).toEqual([
        FIRST_DEFECT,
        SECOND_DEFECT,
      ]);
    });

    it("should bind firstRowIndex to template correctly", () => {
      mockStateService.page.set(2);
      mockStateService.pageSize.set(10);
      expect(getTableHarness().getFirstRowIndex()).toEqual(20);
    });

    it("should bind total records to template correctly", () => {
      mockStateService.totalElements.set(12);
      expect(getTableHarness().getTotalRecords()).toEqual(12);
    });

    it("should bind isLoading to template correctly", () => {
      expect(getTableHarness().isLoading()).toBeFalsy();
      mockStateService.isLoading.set(true);
      expect(getTableHarness().isLoading()).toBeTruthy();
    });

    it("should not display loading template when data is ready", () => {
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBe(0);
    });

    it("should display table body when data is ready", () => {
      expect(getTableHarness().isLoading()).toBeFalsy();
    });

    it("should display loading template on loading", () => {
      mockStateService.isLoading.set(true);
      fixture.detectChanges();
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });

    it("should display a loading table while still fetching the data", () => {
      mockStateService.isLoading.set(true);
      expect(getTableHarness().isLoading()).toBeTruthy();
    });

    it("should call function on table query params change", () => {
      const handlerSpy = jest.spyOn(component, "handleTableQueryParamsChange");
      const event: TableLazyLoadEvent = { first: 0, last: 10 };
      getTableHarness().emitLazyLoadEvent(event);
      expect(handlerSpy).toHaveBeenCalledWith(event);
    });

    it("should display the empty message template when data is empty", () => {
      mockStateService.defects.set([]);
      expect(
        DomTestUtils.getElementByType(
          fixture,
          TableEmptyMessageComponent
        ).getInstance()
      ).toBeTruthy();
    });
  });

  describe("handleDefectSelection", () => {
    it("should emit selected defect on selection", () => {
      const emitSpy = jest.spyOn(component.selectedDefectChange, "emit");
      component.handleDefectSelection(FIRST_DEFECT);
      expect(emitSpy).toHaveBeenCalledWith(FIRST_DEFECT);
    });

    it("should call handleDefectSelection on row select", () => {
      const handlerSpy = jest.spyOn(component, "handleDefectSelection");
      getTableHarness().emitSelectionChange(FIRST_DEFECT);
      expect(handlerSpy).toHaveBeenCalledWith(FIRST_DEFECT);
    });
  });

  describe("hiding radio buttons", () => {
    it("should hide the selection header when hideSelection is true", () => {
      component.hideSelection = true;
      fixture.detectChanges();
      const selectionHeader = fixture.debugElement.query(
        By.css('[data-testId="selection-column-header"]')
      );
      expect(selectionHeader.attributes["hidden"]).toBe("");
    });

    it("should show the selection header when hideSelection is false", () => {
      component.hideSelection = false;
      fixture.detectChanges();
      const selectionHeader = fixture.debugElement.query(
        By.css('[data-testId="selection-column-header"]')
      );
      expect(selectionHeader.attributes["hidden"]).toBeUndefined();
    });
  });

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(fixture, "defects-selection-table");
  }
});
