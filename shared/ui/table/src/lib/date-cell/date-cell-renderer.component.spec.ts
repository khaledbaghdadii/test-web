import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DateCellRendererComponent } from "./date-cell-renderer.component";
import { ICellRendererParams } from "ag-grid-enterprise";
import { NO_ERRORS_SCHEMA } from "@angular/core";

describe("DateCellRendererComponent", () => {
  let component: DateCellRendererComponent;
  let fixture: ComponentFixture<DateCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateCellRendererComponent],
    })
      .overrideComponent(DateCellRendererComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DateCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set value from agInit", () => {
    component.agInit({ value: "2025-01-15T10:30:00Z" } as ICellRendererParams);
    expect(component.value).toBe("2025-01-15T10:30:00Z");
  });

  it("should handle undefined value", () => {
    component.agInit({ value: undefined } as ICellRendererParams);
    expect(component.value).toBeUndefined();
  });

  it("should update value on refresh and return true", () => {
    component.agInit({ value: "2025-01-15T10:30:00Z" } as ICellRendererParams);
    const result = component.refresh({
      value: "2025-06-01T12:00:00Z",
    } as ICellRendererParams);
    expect(component.value).toBe("2025-06-01T12:00:00Z");
    expect(result).toBe(true);
  });
});
