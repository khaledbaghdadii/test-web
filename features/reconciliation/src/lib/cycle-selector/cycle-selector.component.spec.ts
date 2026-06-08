import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CycleSelectorComponent, Cycle } from "./cycle-selector.component";
import { CycleSelectorService } from "./cycle-selector.service";
import { ActivatedRoute } from "@angular/router";
import { of, throwError } from "rxjs";
import { Table } from "primeng/table";

const PROJECT_ID = "test-project-id";

const CYCLE_1: Cycle = {
  id: "cycle-1",
  name: "Cycle 1",
  description: "First cycle",
  sourceVersion: "1.0",
  targetVersion: "2.0",
  createdAt: "2024-01-01",
  status: "ONGOING",
  creatorEmail: "user1@test.com",
};

const CYCLE_2: Cycle = {
  id: "cycle-2",
  name: "Cycle 2",
  description: "Second cycle",
  sourceVersion: "2.0",
  targetVersion: "3.0",
  createdAt: "2024-02-01",
  status: "ARCHIVED",
  creatorEmail: "user2@test.com",
};

const CYCLE_3: Cycle = {
  id: "cycle-3",
  name: "Cycle 3",
  description: "Third cycle",
  sourceVersion: "3.0",
  targetVersion: "4.0",
  createdAt: "2024-03-01",
  status: "ONGOING",
  creatorEmail: "user3@test.com",
};

const CYCLES: Cycle[] = [CYCLE_1, CYCLE_2, CYCLE_3];

const mockCycleSelectorService = {
  getCycles: jest.fn(() => of(CYCLES)),
};

const mockActivatedRoute = {
  snapshot: { params: { projectId: PROJECT_ID } },
};

function mockCycleTable(
  overrides: Partial<{
    filteredValue: Cycle[] | null;
    value: Cycle[];
    first: number;
    rows: number;
  }> = {}
): Table {
  return {
    filteredValue: overrides.filteredValue ?? null,
    value: overrides.value ?? CYCLES,
    first: overrides.first ?? 0,
    rows: overrides.rows ?? 5,
    filterGlobal: jest.fn(),
  } as unknown as Table;
}

describe("CycleSelectorComponent", () => {
  let component: CycleSelectorComponent;
  let fixture: ComponentFixture<CycleSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CycleSelectorComponent],
    })
      .overrideProvider(CycleSelectorService, {
        useValue: mockCycleSelectorService,
      })
      .overrideProvider(ActivatedRoute, { useValue: mockActivatedRoute })
      .compileComponents();

    fixture = TestBed.createComponent(CycleSelectorComponent);
    component = fixture.componentInstance;
    jest.clearAllMocks();
    mockCycleSelectorService.getCycles.mockReturnValue(of(CYCLES));
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe("initialization", () => {
    it("should load cycles via ngOnInit when no projectId input is provided, using route param", () => {
      fixture.detectChanges();

      expect(mockCycleSelectorService.getCycles).toHaveBeenCalledWith(
        PROJECT_ID
      );
      expect(component.cycles).toEqual(CYCLES);
      expect(component.loading).toBe(false);
    });

    it("should load cycles via ngOnChanges when projectId input is set", () => {
      fixture.componentRef.setInput("projectId", "input-project-id");
      fixture.detectChanges();

      expect(mockCycleSelectorService.getCycles).toHaveBeenCalledWith(
        "input-project-id"
      );
    });

    it("should not call getCycles twice when projectId input is set (ngOnChanges handles it, ngOnInit skips)", () => {
      fixture.componentRef.setInput("projectId", "input-project-id");
      fixture.detectChanges();

      expect(mockCycleSelectorService.getCycles).toHaveBeenCalledTimes(1);
    });

    it("should set loading to false after cycles are loaded", () => {
      fixture.detectChanges();

      expect(component.loading).toBe(false);
    });

    it("should set loading to false on error", () => {
      mockCycleSelectorService.getCycles.mockReturnValue(
        throwError(() => new Error("Load error"))
      );
      jest.spyOn(console, "error").mockImplementation();

      fixture.detectChanges();

      expect(component.loading).toBe(false);
    });
  });

  describe("preselection", () => {
    it("should preselect cycles matching preselectedCycleIds", () => {
      fixture.componentRef.setInput("preselectedCycleIds", [
        CYCLE_1.id,
        CYCLE_3.id,
      ]);
      fixture.detectChanges();

      expect(component.selectedCycles.length).toBe(2);
      expect(component.selectedCycles.map((c) => c.id)).toEqual([
        CYCLE_1.id,
        CYCLE_3.id,
      ]);
    });

    it("should emit selectionChange when preselection is applied", () => {
      const emitSpy = jest.spyOn(component.selectionChange, "emit");
      fixture.componentRef.setInput("preselectedCycleIds", [CYCLE_1.id]);
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith([CYCLE_1]);
    });

    it("should select only the first cycle in single-select mode", () => {
      fixture.componentRef.setInput("multiSelect", false);
      fixture.componentRef.setInput("preselectedCycleIds", [
        CYCLE_1.id,
        CYCLE_2.id,
      ]);
      fixture.detectChanges();

      expect(component.selectedCycles.length).toBe(1);
      expect(component.selectedCycle).toEqual(CYCLE_1);
    });

    it("should not emit selectionChange when preselectedCycleIds is empty", () => {
      const emitSpy = jest.spyOn(component.selectionChange, "emit");
      fixture.componentRef.setInput("preselectedCycleIds", []);
      fixture.detectChanges();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe("multi-select mode", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("multiSelect", true);
      fixture.detectChanges();
    });

    it("should add a cycle to selection on checkbox check", () => {
      component.onCheckboxChange(CYCLE_1, true);

      expect(component.selectedCycles).toContain(CYCLE_1);
    });

    it("should remove a cycle from selection on checkbox uncheck", () => {
      component.selectedCycles = [CYCLE_1, CYCLE_2];
      component.onCheckboxChange(CYCLE_1, false);

      expect(component.selectedCycles).not.toContain(CYCLE_1);
      expect(component.selectedCycles).toContain(CYCLE_2);
    });

    it("should not add duplicate cycles on repeated check", () => {
      component.selectedCycles = [CYCLE_1];
      component.onCheckboxChange(CYCLE_1, true);

      expect(
        component.selectedCycles.filter((c) => c.id === CYCLE_1.id).length
      ).toBe(1);
    });

    it("should select all cycles", () => {
      component.selectAll();

      expect(component.selectedCycles).toEqual(CYCLES);
    });

    it("should unselect all cycles", () => {
      component.selectedCycles = [...CYCLES];
      component.unselectAll();

      expect(component.selectedCycles.length).toBe(0);
    });

    it("should toggle select all — select when none selected", () => {
      component.toggleSelectAll();

      expect(component.selectedCycles.length).toBe(CYCLES.length);
    });

    it("should toggle select all — unselect when all selected", () => {
      component.selectedCycles = [...CYCLES];
      component.toggleSelectAll();

      expect(component.selectedCycles.length).toBe(0);
    });

    it("should return true for allSelected when all cycles are selected", () => {
      component.selectedCycles = [...CYCLES];

      expect(component.allSelected).toBe(true);
    });

    it("should return false for allSelected when not all cycles are selected", () => {
      component.selectedCycles = [CYCLE_1];

      expect(component.allSelected).toBe(false);
    });

    it("should emit selectionChange on checkbox check", () => {
      const emitSpy = jest.spyOn(component.selectionChange, "emit");
      component.onCheckboxChange(CYCLE_1, true);

      expect(emitSpy).toHaveBeenCalledWith([CYCLE_1]);
    });

    it("should emit selectionChange on select all", () => {
      const emitSpy = jest.spyOn(component.selectionChange, "emit");
      component.selectAll();

      expect(emitSpy).toHaveBeenCalledWith(CYCLES);
    });

    it("should emit selectionChange on unselect all", () => {
      const emitSpy = jest.spyOn(component.selectionChange, "emit");
      component.selectedCycles = [...CYCLES];
      component.unselectAll();

      expect(emitSpy).toHaveBeenCalledWith([]);
    });
  });

  describe("single-select mode", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("multiSelect", false);
      fixture.detectChanges();
    });

    it("should set selectedCycle on radio change", () => {
      component.onRadioChange(CYCLE_2);

      expect(component.selectedCycle).toEqual(CYCLE_2);
      expect(component.selectedCycles).toEqual([CYCLE_2]);
    });

    it("should replace previous selection on subsequent radio change", () => {
      component.onRadioChange(CYCLE_1);
      component.onRadioChange(CYCLE_2);

      expect(component.selectedCycle).toEqual(CYCLE_2);
      expect(component.selectedCycles.length).toBe(1);
    });

    it("should emit selectionChange on radio change", () => {
      const emitSpy = jest.spyOn(component.selectionChange, "emit");
      component.onRadioChange(CYCLE_1);

      expect(emitSpy).toHaveBeenCalledWith([CYCLE_1]);
    });
  });

  describe("pageOnlySelect mode", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("pageOnlySelect", true);
      fixture.detectChanges();
      component.cycleTable = mockCycleTable({
        value: CYCLES,
        first: 0,
        rows: 2,
      });
    });

    it("should return true for allSelected when all page cycles are selected", () => {
      component.selectedCycles = [CYCLE_1, CYCLE_2];

      expect(component.allSelected).toBe(true);
    });

    it("should return false for allSelected when not all page cycles are selected", () => {
      component.selectedCycles = [CYCLE_1];

      expect(component.allSelected).toBe(false);
    });

    it("should return false for allSelected when page is empty", () => {
      component.cycleTable = mockCycleTable({ value: [], first: 0, rows: 2 });

      expect(component.allSelected).toBe(false);
    });

    it("should select only current page cycles on selectAll", () => {
      component.selectedCycles = [];
      component.selectAll();

      expect(component.selectedCycles).toEqual([CYCLE_1, CYCLE_2]);
    });

    it("should not duplicate already-selected cycles on selectAll", () => {
      component.selectedCycles = [CYCLE_1];
      component.selectAll();

      expect(component.selectedCycles.length).toBe(2);
      expect(component.selectedCycles.map((c) => c.id)).toContain(CYCLE_2.id);
    });

    it("should unselect only current page cycles on unselectAll", () => {
      component.selectedCycles = [CYCLE_1, CYCLE_2, CYCLE_3];
      component.unselectAll();

      expect(component.selectedCycles).toEqual([CYCLE_3]);
    });

    it("should use filteredValue over value when available", () => {
      const filtered = [CYCLE_2, CYCLE_3];
      component.cycleTable = mockCycleTable({
        filteredValue: filtered,
        value: CYCLES,
        first: 0,
        rows: 2,
      });
      component.selectedCycles = [];
      component.selectAll();

      expect(component.selectedCycles).toEqual([CYCLE_2, CYCLE_3]);
    });
  });

  describe("getCurrentPageCycles when cycleTable is not initialised", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("pageOnlySelect", true);
      fixture.detectChanges();
      component.cycleTable = undefined as unknown as Table;
    });

    it("should return false for allSelected when cycleTable is not yet available", () => {
      expect(component.allSelected).toBe(false);
    });

    it("should not add any cycles on selectAll when cycleTable is not yet available", () => {
      component.selectedCycles = [];
      component.selectAll();

      expect(component.selectedCycles).toEqual([]);
    });

    it("should not remove any cycles on unselectAll when cycleTable is not yet available", () => {
      component.selectedCycles = [CYCLE_1];
      component.unselectAll();

      expect(component.selectedCycles).toEqual([CYCLE_1]);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.cycleTable = mockCycleTable();
    });

    it("should call filterGlobal with the typed value on search", () => {
      const event = { target: { value: "Cycle 1" } } as unknown as Event;
      component.onSearch(event);

      expect(component.cycleTable.filterGlobal).toHaveBeenCalledWith(
        "Cycle 1",
        "contains"
      );
    });

    it("should clear the search value and filter on clearSearch", () => {
      component.searchValue = "test";
      component.clearSearch();

      expect(component.searchValue).toBe("");
      expect(component.cycleTable.filterGlobal).toHaveBeenCalledWith(
        "",
        "contains"
      );
    });
  });

  describe("isCycleSelected", () => {
    beforeEach(() => fixture.detectChanges());

    it("should return true if cycle is in selectedCycles", () => {
      component.selectedCycles = [CYCLE_1];

      expect(component.isCycleSelected(CYCLE_1)).toBe(true);
    });

    it("should return false if cycle is not in selectedCycles", () => {
      component.selectedCycles = [CYCLE_1];

      expect(component.isCycleSelected(CYCLE_2)).toBe(false);
    });
  });

  describe("default input values", () => {
    it("should default multiSelect to true", () => {
      expect(component.multiSelect).toBe(true);
    });

    it("should default pageSize to 5", () => {
      expect(component.pageSize).toBe(5);
    });

    it("should default showSearch to true", () => {
      expect(component.showSearch).toBe(true);
    });

    it("should default preselectedCycleIds to empty array", () => {
      expect(component.preselectedCycleIds).toEqual([]);
    });

    it("should default pageOnlySelect to false", () => {
      expect(component.pageOnlySelect).toBe(false);
    });
  });
});
