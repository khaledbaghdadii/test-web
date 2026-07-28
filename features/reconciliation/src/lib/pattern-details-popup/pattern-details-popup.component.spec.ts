import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { of } from "rxjs";
import {
  PatternDetailsPopupComponent,
  PatternDetails,
} from "@mxflow/features/reconciliation";
const PATTERN_DETAILS: PatternDetails = {
  id: 3,
  title: "Pattern 3",
  description: "A pattern",
  createdInPackage: "Package A",
  createdInCycleId: "cycle-1",
  originalScript: "{{Type}}",
  linkedRootCauses: [],
  impactedGroups: ["tradeDate"],
  differenceTypes: ["MISMATCH"],
  ownerUserName: "owner@test.com",
  referencedColumns: [],
  deletable: true,
  editable: true,
  editedVersion: false,
  patternType: "SPECIFIC",
  versionNumber: 1,
  approved: false,
  patternInstanceId: "pattern-instance-id",
  unapplied: false,
};
describe("PatternDetailsPopupComponent", () => {
  let component: PatternDetailsPopupComponent;
  let fixture: ComponentFixture<PatternDetailsPopupComponent>;
  const appConfig = { gatewayUrl: "GATEWAY_URL/" } as unknown as AppConfig;
  const mockActivatedRoute = {
    snapshot: { params: {} as Record<string, string> },
  };
  const mockHttpClient = {
    get: jest.fn(() => of(PATTERN_DETAILS)),
  } as unknown as HttpClient;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternDetailsPopupComponent],
      providers: [
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PatternDetailsPopupComponent);
    component = fixture.componentInstance;
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
  describe("open", () => {
    it("should make the popup visible and emit opened and visibleChange", () => {
      const visibleChangeSpy = jest.spyOn(component.visibleChange, "emit");
      const openedSpy = jest.spyOn(component.opened, "emit");
      component.open();
      expect(component.visible).toBe(true);
      expect(visibleChangeSpy).toHaveBeenCalledWith(true);
      expect(openedSpy).toHaveBeenCalledTimes(1);
    });
    it("should do nothing when already visible", () => {
      component.visible = true;
      const visibleChangeSpy = jest.spyOn(component.visibleChange, "emit");
      const openedSpy = jest.spyOn(component.opened, "emit");
      component.open();
      expect(visibleChangeSpy).not.toHaveBeenCalled();
      expect(openedSpy).not.toHaveBeenCalled();
    });
  });
  describe("close", () => {
    it("should hide the popup and emit closed and visibleChange", () => {
      component.visible = true;
      const visibleChangeSpy = jest.spyOn(component.visibleChange, "emit");
      const closedSpy = jest.spyOn(component.closed, "emit");
      component.close();
      expect(component.visible).toBe(false);
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
      expect(closedSpy).toHaveBeenCalledTimes(1);
    });
    it("should do nothing when already hidden", () => {
      const visibleChangeSpy = jest.spyOn(component.visibleChange, "emit");
      const closedSpy = jest.spyOn(component.closed, "emit");
      component.close();
      expect(visibleChangeSpy).not.toHaveBeenCalled();
      expect(closedSpy).not.toHaveBeenCalled();
    });
  });
  describe("onVisibleChange", () => {
    it("should emit opened when becoming visible (e.g. dialog event)", () => {
      const openedSpy = jest.spyOn(component.opened, "emit");
      const visibleChangeSpy = jest.spyOn(component.visibleChange, "emit");
      component.onVisibleChange(true);
      expect(component.visible).toBe(true);
      expect(openedSpy).toHaveBeenCalledTimes(1);
      expect(visibleChangeSpy).toHaveBeenCalledWith(true);
    });
    it("should emit closed when becoming hidden (e.g. dialog event)", () => {
      component.visible = true;
      const closedSpy = jest.spyOn(component.closed, "emit");
      const visibleChangeSpy = jest.spyOn(component.visibleChange, "emit");
      component.onVisibleChange(false);
      expect(component.visible).toBe(false);
      expect(closedSpy).toHaveBeenCalledTimes(1);
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    });
    it("should not emit when the value does not change", () => {
      const openedSpy = jest.spyOn(component.opened, "emit");
      const closedSpy = jest.spyOn(component.closed, "emit");
      const visibleChangeSpy = jest.spyOn(component.visibleChange, "emit");
      component.onVisibleChange(false);
      expect(openedSpy).not.toHaveBeenCalled();
      expect(closedSpy).not.toHaveBeenCalled();
      expect(visibleChangeSpy).not.toHaveBeenCalled();
    });
  });
  describe("toggleMaximized", () => {
    it("should toggle the maximized flag", () => {
      expect(component.maximized).toBe(false);
      component.toggleMaximized();
      expect(component.maximized).toBe(true);
      component.toggleMaximized();
      expect(component.maximized).toBe(false);
    });
  });
  describe("onDetailsLoaded", () => {
    it("should store the loaded details for the header", () => {
      component.onDetailsLoaded(PATTERN_DETAILS);
      expect(component.patternDetails).toEqual(PATTERN_DETAILS);
    });
  });
});
