import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ScenarioRunEnvStatusCellRendererComponent } from "./scenario-run-env-status-cell-renderer.component";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import type { ICellRendererParams } from "ag-grid-community";

describe("ScenarioRunEnvStatusCellRendererComponent", () => {
  let component: ScenarioRunEnvStatusCellRendererComponent;
  let fixture: ComponentFixture<ScenarioRunEnvStatusCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScenarioRunEnvStatusCellRendererComponent],
    }).overrideComponent(ScenarioRunEnvStatusCellRendererComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    });

    fixture = TestBed.createComponent(
      ScenarioRunEnvStatusCellRendererComponent
    );
    component = fixture.componentInstance;
  });

  it("sets status from params value", () => {
    component.agInit({ value: EnvironmentStatus.READY } as ICellRendererParams);
    fixture.detectChanges();

    expect(component.status).toBe(EnvironmentStatus.READY);
  });

  it("sets undefined status when value is missing", () => {
    component.agInit({ value: undefined } as ICellRendererParams);
    fixture.detectChanges();

    expect(component.status).toBeUndefined();
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
