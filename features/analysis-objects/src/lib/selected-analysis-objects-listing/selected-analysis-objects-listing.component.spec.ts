import {
  AnalysisObjectSelectionType,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockBuilder } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { Chip } from "primeng/chip";
import { InputSignal, signal } from "@angular/core";

describe("selected analysis objects listing component", () => {
  const ANALYSIS_OBJECT_ID_1 = "id1";
  const ANALYSIS_OBJECT_ID_2 = "id2";
  let component: SelectedAnalysisObjectsListingComponent;
  let fixture: ComponentFixture<SelectedAnalysisObjectsListingComponent>;
  beforeEach(async () => {
    await MockBuilder(SelectedAnalysisObjectsListingComponent);

    fixture = TestBed.createComponent(SelectedAnalysisObjectsListingComponent);
    component = fixture.componentInstance;
  });

  describe("display", () => {
    it("should display no items selected if no analysis object are selected", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        []
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const noItemsSelected = fixture.debugElement.query(
        By.css("#no-items-selected")
      );
      expect(noItemsSelected).toBeTruthy();
    });

    it("should display the selected items section if they exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        getSelectedAnalysisObjects()
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const selectedItemsSection = fixture.debugElement.query(
        By.css("#items-selected")
      );
      expect(selectedItemsSection).toBeTruthy();
    });

    it("should display the fully selected items section if they exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        getSelectedAnalysisObjects()
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const fullySelectedItemsSection = fixture.debugElement.query(
        By.css("#items-fully-selected")
      );
      expect(fullySelectedItemsSection).toBeTruthy();
    });

    it("should not display fully selected items section if none exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>([
        getPartiallySelectedAnalysisObject(),
      ]) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const fullySelectedItemsSection = fixture.debugElement.query(
        By.css("#items-fully-selected")
      );
      expect(fullySelectedItemsSection).toBeFalsy();
    });

    it("should display the partially selected items section if they exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        getSelectedAnalysisObjects()
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const fullySelectedItemsSection = fixture.debugElement.query(
        By.css("#items-partially-selected")
      );
      expect(fullySelectedItemsSection).toBeTruthy();
    });

    it("should not display partially selected items section if none exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>([
        getFullySelectedAnalysisObject(),
      ]) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const partiallySelectedItemsSection = fixture.debugElement.query(
        By.css("#items-partially-selected")
      );
      expect(partiallySelectedItemsSection).toBeFalsy();
    });

    it("should display the divider if both fully and partially links exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        getSelectedAnalysisObjects()
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const divider = fixture.debugElement.query(By.css("#items-divider"));
      expect(divider).toBeTruthy();
    });

    it("should not display the divider if only full links exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>([
        getFullySelectedAnalysisObject(),
      ]) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const divider = fixture.debugElement.query(By.css("#items-divider"));
      expect(divider).toBeFalsy();
    });

    it("should not display the divider if only partial links exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>([
        getPartiallySelectedAnalysisObject(),
      ]) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const divider = fixture.debugElement.query(By.css("#items-divider"));
      expect(divider).toBeFalsy();
    });

    it("should not display the divider if full and partial links do not exist", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        []
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const divider = fixture.debugElement.query(By.css("#items-divider"));
      expect(divider).toBeFalsy();
    });
  });

  describe("initialize", () => {
    it("should initialize the component", () => {
      expect(component).toBeDefined();
    });

    it("should initialize the selected analysis objects to empty list", () => {
      expect(component.selectedAnalysisObjects()).toEqual([]);
    });

    it("should initialize the fully selected analysis objects to empty list", () => {
      expect(component.fullySelectedAnalysisObjects()).toEqual([]);
    });

    it("should initialize the partially selected analysis objects to empty list", () => {
      expect(component.partiallySelectedAnalysisObjects()).toEqual([]);
    });

    it("should update fully selected analysis objects list to only include the fully selected ones", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        getSelectedAnalysisObjects()
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      expect(component.fullySelectedAnalysisObjects()).toEqual([
        getFullySelectedAnalysisObject(),
      ]);
    });

    it("should update partially selected analysis objects list to only include the partially selected ones", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        getSelectedAnalysisObjects()
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      expect(component.partiallySelectedAnalysisObjects()).toEqual([
        getPartiallySelectedAnalysisObject(),
      ]);
    });
  });

  describe("unselect analysis object", () => {
    it("should emit an analysis object removed event when a fully selected analysis object is unselected", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        getSelectedAnalysisObjects()
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const analysisObjectRemovedSpy = jest.spyOn(
        component.analysisObjectRemoved,
        "emit"
      );
      const analysisObjectChip = fixture.debugElement.query(
        By.css("#fully-selected-analysis-object-" + ANALYSIS_OBJECT_ID_1)
      ).componentInstance as Chip;
      analysisObjectChip.onRemove.emit(new MouseEvent("click"));
      expect(analysisObjectRemovedSpy).toHaveBeenCalledWith(
        ANALYSIS_OBJECT_ID_1
      );
    });

    it("should emit an analysis object removed event when a partially selected analysis object is unselected", () => {
      component.selectedAnalysisObjects = signal<SelectedAnalysisObject[]>(
        getSelectedAnalysisObjects()
      ) as unknown as InputSignal<SelectedAnalysisObject[]>;
      fixture.detectChanges();
      const analysisObjectRemovedSpy = jest.spyOn(
        component.analysisObjectRemoved,
        "emit"
      );
      const analysisObjectChip = fixture.debugElement.query(
        By.css("#partially-selected-analysis-object-" + ANALYSIS_OBJECT_ID_2)
      ).componentInstance as Chip;
      analysisObjectChip.onRemove.emit(new MouseEvent("click"));
      expect(analysisObjectRemovedSpy).toHaveBeenCalledWith(
        ANALYSIS_OBJECT_ID_2
      );
    });
  });

  function getSelectedAnalysisObjects(): SelectedAnalysisObject[] {
    return [
      getFullySelectedAnalysisObject(),
      getPartiallySelectedAnalysisObject(),
    ];
  }

  function getFullySelectedAnalysisObject(): SelectedAnalysisObject {
    return {
      id: ANALYSIS_OBJECT_ID_1,
      selectionType: AnalysisObjectSelectionType.FULL,
    } as unknown as SelectedAnalysisObject;
  }

  function getPartiallySelectedAnalysisObject(): SelectedAnalysisObject {
    return {
      id: ANALYSIS_OBJECT_ID_2,
      selectionType: AnalysisObjectSelectionType.PARTIAL,
    } as unknown as SelectedAnalysisObject;
  }
});
