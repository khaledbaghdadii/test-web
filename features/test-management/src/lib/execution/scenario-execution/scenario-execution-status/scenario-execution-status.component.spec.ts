import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScenarioExecutionStatusComponent } from "./scenario-execution-status.component";
import { ScenarioExecutionStatus } from "./scenario-execution-status";
import { DomTestUtils } from "@mxevolve/testing";
import { Tag } from "primeng/tag";

describe("ScenarioExecutionStatusComponent", () => {
  let fixture: ComponentFixture<ScenarioExecutionStatusComponent>;
  let component: ScenarioExecutionStatusComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioExecutionStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionStatusComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.componentRef.setInput("status", ScenarioExecutionStatus.PASSED);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe("status tag rendering", () => {
    it("should render PASSED status tag with success severity", () => {
      fixture.componentRef.setInput("status", ScenarioExecutionStatus.PASSED);
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("success");
    });

    it("should render FAILED status tag with danger severity", () => {
      fixture.componentRef.setInput("status", ScenarioExecutionStatus.FAILED);
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("danger");
    });

    it("should render ABORTING status tag with warn severity", () => {
      fixture.componentRef.setInput("status", ScenarioExecutionStatus.ABORTING);
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("warn");
    });

    it("should render ABORTED status tag with danger severity", () => {
      fixture.componentRef.setInput("status", ScenarioExecutionStatus.ABORTED);
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("danger");
    });

    it("should render FAILED_TO_ABORT status tag with danger severity", () => {
      fixture.componentRef.setInput(
        "status",
        ScenarioExecutionStatus.FAILED_TO_ABORT
      );
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("danger");
    });

    it("should render UNDERWAY status tag with warn severity", () => {
      fixture.componentRef.setInput("status", ScenarioExecutionStatus.UNDERWAY);
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("warn");
    });

    it("should render READY status tag with info severity", () => {
      fixture.componentRef.setInput("status", ScenarioExecutionStatus.READY);
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("info");
    });

    it("should render NA status tag with secondary severity", () => {
      fixture.componentRef.setInput("status", ScenarioExecutionStatus.NA);
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("secondary");
    });

    it("should render default status tag with secondary severity for undefined status", () => {
      fixture.componentRef.setInput("status", undefined);
      fixture.detectChanges();

      const tag = DomTestUtils.getElementByType(fixture, Tag);
      expect(tag.isRendered()).toBe(true);
      expect(tag.getInstance().severity).toBe("secondary");
    });
  });
});
