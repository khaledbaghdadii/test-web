import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { StartDateCellRendererComponent } from "./start-date-cell-renderer.component";
import type { ICellRendererParams } from "ag-grid-community";

describe("StartDateCellRendererComponent", () => {
  let component: StartDateCellRendererComponent;
  let fixture: ComponentFixture<StartDateCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StartDateCellRendererComponent],
    }).overrideComponent(StartDateCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(StartDateCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
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
