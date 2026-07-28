import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of, throwError } from "rxjs";
import { PatternDetailsComponent } from "./pattern-details.component";
import { PatternDetailsService } from "./pattern-details.service";
import { PatternDetails } from "./pattern-details.model";
const PROJECT_ID = "route-project-id";
const PATTERN_INSTANCE_ID = "pattern-instance-id";
const PATTERN_DETAILS: PatternDetails = {
  id: 7,
  title: "Pattern 7",
  description: "A pattern",
  createdInPackage: "Package A",
  createdInCycleId: "cycle-1",
  originalScript: "{{Type}}",
  linkedRootCauses: [
    { id: 1, displayName: "RC1" },
    { id: 2, displayName: "RC2" },
  ],
  impactedGroups: ["tradeDate"],
  differenceTypes: ["MISMATCH"],
  ownerUserName: "owner@test.com",
  referencedColumns: [{ id: "c1", name: "Col 1", type: "MX" }],
  deletable: true,
  editable: true,
  editedVersion: false,
  patternType: "SPECIFIC",
  versionNumber: 1,
  approved: false,
  patternInstanceId: PATTERN_INSTANCE_ID,
  unapplied: false,
};
const mockPatternDetailsService = {
  getPatternDetailsByPatternInstanceId: jest.fn(() => of(PATTERN_DETAILS)),
};
const mockActivatedRoute = {
  snapshot: { params: {} as Record<string, string> },
};
describe("PatternDetailsComponent", () => {
  let component: PatternDetailsComponent;
  let fixture: ComponentFixture<PatternDetailsComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternDetailsComponent],
    })
      .overrideProvider(PatternDetailsService, {
        useValue: mockPatternDetailsService,
      })
      .overrideProvider(ActivatedRoute, { useValue: mockActivatedRoute })
      .compileComponents();
    fixture = TestBed.createComponent(PatternDetailsComponent);
    component = fixture.componentInstance;
    jest.clearAllMocks();
    mockActivatedRoute.snapshot.params = { projectId: PROJECT_ID };
    mockPatternDetailsService.getPatternDetailsByPatternInstanceId.mockReturnValue(
      of(PATTERN_DETAILS)
    );
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
  describe("input-driven usage (page / popup)", () => {
    it("should load details using projectId input when provided", () => {
      fixture.componentRef.setInput("projectId", "input-project-id");
      fixture.componentRef.setInput("patternInstanceId", PATTERN_INSTANCE_ID);
      fixture.detectChanges();
      expect(
        mockPatternDetailsService.getPatternDetailsByPatternInstanceId
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPatternDetailsService.getPatternDetailsByPatternInstanceId
      ).toHaveBeenCalledWith(PATTERN_INSTANCE_ID, "input-project-id");
      expect(component.patternDetails).toEqual(PATTERN_DETAILS);
      expect(component.loading).toBe(false);
    });
    it("should fall back to projectId from the route when no input is provided", () => {
      fixture.componentRef.setInput("patternInstanceId", PATTERN_INSTANCE_ID);
      fixture.detectChanges();
      expect(
        mockPatternDetailsService.getPatternDetailsByPatternInstanceId
      ).toHaveBeenCalledWith(PATTERN_INSTANCE_ID, PROJECT_ID);
    });
    it("should emit detailsLoaded when details are fetched", () => {
      const emitSpy = jest.spyOn(component.detailsLoaded, "emit");
      fixture.componentRef.setInput("patternInstanceId", PATTERN_INSTANCE_ID);
      fixture.detectChanges();
      expect(emitSpy).toHaveBeenCalledWith(PATTERN_DETAILS);
    });
    it("should not call the service when patternInstanceId is missing", () => {
      fixture.componentRef.setInput("projectId", "input-project-id");
      fixture.detectChanges();
      expect(
        mockPatternDetailsService.getPatternDetailsByPatternInstanceId
      ).not.toHaveBeenCalled();
    });
    it("should set loading to false and emit loadError on failure", () => {
      const error = new Error("Load error");
      mockPatternDetailsService.getPatternDetailsByPatternInstanceId.mockReturnValue(
        throwError(() => error)
      );
      const errorSpy = jest.spyOn(component.loadError, "emit");
      fixture.componentRef.setInput("patternInstanceId", PATTERN_INSTANCE_ID);
      fixture.detectChanges();
      expect(component.loading).toBe(false);
      expect(component.patternDetails).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(error);
    });
  });
  describe("route-driven usage (/pattern/:id)", () => {
    it("should read patternInstanceId from the route id param and load once", () => {
      mockActivatedRoute.snapshot.params = {
        projectId: PROJECT_ID,
        id: PATTERN_INSTANCE_ID,
      };
      fixture.detectChanges();
      expect(component.patternInstanceId).toBe(PATTERN_INSTANCE_ID);
      expect(
        mockPatternDetailsService.getPatternDetailsByPatternInstanceId
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPatternDetailsService.getPatternDetailsByPatternInstanceId
      ).toHaveBeenCalledWith(PATTERN_INSTANCE_ID, PROJECT_ID);
    });
    it("should not load when neither input nor route id is available", () => {
      mockActivatedRoute.snapshot.params = { projectId: PROJECT_ID };
      fixture.detectChanges();
      expect(
        mockPatternDetailsService.getPatternDetailsByPatternInstanceId
      ).not.toHaveBeenCalled();
    });
  });
  describe("root cause interactions", () => {
    it("should emit rootCauseClicked on click", () => {
      const emitSpy = jest.spyOn(component.rootCauseClicked, "emit");
      component.onRootCauseClick(5);
      expect(emitSpy).toHaveBeenCalledWith(5);
    });
    it("should emit rootCauseClicked on Enter key", () => {
      const emitSpy = jest.spyOn(component.rootCauseClicked, "emit");
      const event = {
        key: "Enter",
        preventDefault: jest.fn(),
      } as unknown as KeyboardEvent;
      component.onRootCauseChipKeyDown(event, 9);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith(9);
    });
    it("should not emit rootCauseClicked on other keys", () => {
      const emitSpy = jest.spyOn(component.rootCauseClicked, "emit");
      const event = {
        key: "Tab",
        preventDefault: jest.fn(),
      } as unknown as KeyboardEvent;
      component.onRootCauseChipKeyDown(event, 9);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
