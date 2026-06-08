import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { EnvironmentStatusCellRendererComponent } from "./environment-status-cell-renderer.component";
import type { ICellRendererParams } from "ag-grid-community";

describe("EnvironmentStatusCellRendererComponent", () => {
  let component: EnvironmentStatusCellRendererComponent;
  let fixture: ComponentFixture<EnvironmentStatusCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EnvironmentStatusCellRendererComponent],
    }).overrideComponent(EnvironmentStatusCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(EnvironmentStatusCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("sets status from params value", () => {
    component.agInit({ value: "READY" } as ICellRendererParams);

    expect(component.status).toBe("READY");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
