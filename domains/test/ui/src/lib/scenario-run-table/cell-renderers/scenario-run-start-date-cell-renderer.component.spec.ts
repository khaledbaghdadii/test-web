import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ScenarioRunStartDateCellRendererComponent } from "./scenario-run-start-date-cell-renderer.component";
import type { ICellRendererParams } from "ag-grid-community";

describe("ScenarioRunStartDateCellRendererComponent", () => {
  let component: ScenarioRunStartDateCellRendererComponent;
  let fixture: ComponentFixture<ScenarioRunStartDateCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScenarioRunStartDateCellRendererComponent],
    }).overrideComponent(ScenarioRunStartDateCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(
      ScenarioRunStartDateCellRendererComponent
    );
    component = fixture.componentInstance;
  });

  it("sets date from params value", () => {
    component.agInit({
      value: "2026-01-15T10:30:00Z",
    } as ICellRendererParams);

    expect(component.date).toBe("2026-01-15T10:30:00Z");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
