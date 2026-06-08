import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ScenarioRunStatusCellRendererComponent } from "./scenario-run-status-cell-renderer.component";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import type { ICellRendererParams } from "ag-grid-community";

describe("ScenarioRunStatusCellRendererComponent", () => {
  let component: ScenarioRunStatusCellRendererComponent;
  let fixture: ComponentFixture<ScenarioRunStatusCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScenarioRunStatusCellRendererComponent],
    }).overrideComponent(ScenarioRunStatusCellRendererComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    });

    fixture = TestBed.createComponent(ScenarioRunStatusCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("sets status from params value", () => {
    component.agInit({
      value: ScenarioRunStatus.PASSED,
    } as ICellRendererParams);
    fixture.detectChanges();

    expect(component.status).toBe(ScenarioRunStatus.PASSED);
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
