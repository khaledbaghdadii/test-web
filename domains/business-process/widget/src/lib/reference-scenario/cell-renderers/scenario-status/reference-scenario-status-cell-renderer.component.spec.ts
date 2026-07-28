import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import type { ICellRendererParams } from "ag-grid-community";
import { ReferenceScenarioStatusCellRendererComponent } from "./reference-scenario-status-cell-renderer.component";

const paramsWithValue = (value: unknown): ICellRendererParams =>
  ({ value } as ICellRendererParams);

describe("ReferenceScenarioStatusCellRendererComponent", () => {
  let component: ReferenceScenarioStatusCellRendererComponent;
  let fixture: ComponentFixture<ReferenceScenarioStatusCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReferenceScenarioStatusCellRendererComponent],
    }).overrideComponent(ReferenceScenarioStatusCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(
      ReferenceScenarioStatusCellRendererComponent
    );
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("maps a known status to its tag configuration", () => {
    component.agInit(paramsWithValue("Passed"));

    expect(component.configuration).toEqual({
      label: "Passed",
      severity: "success",
      icon: "check_circle",
    });
  });

  it("marks aborting status as spinning", () => {
    component.agInit(paramsWithValue("Aborting"));

    expect(component.configuration.spin).toBe(true);
    expect(component.configuration.severity).toBe("danger");
  });

  it("renders an unknown status as a secondary tag with its raw label", () => {
    component.agInit(paramsWithValue("EXECUTING"));

    expect(component.configuration).toEqual({
      label: "EXECUTING",
      severity: "secondary",
      icon: "remove_circle_outline",
    });
  });

  it("falls back to a dash when the status is empty", () => {
    component.agInit(paramsWithValue(""));

    expect(component.configuration.label).toBe("-");
    expect(component.configuration.severity).toBe("secondary");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
