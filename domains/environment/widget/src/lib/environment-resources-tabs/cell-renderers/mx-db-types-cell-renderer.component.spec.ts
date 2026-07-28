import { TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import type { ICellRendererParams } from "ag-grid-community";
import { MxDbTypesCellRendererComponent } from "./mx-db-types-cell-renderer.component";

function createComponent(): MxDbTypesCellRendererComponent {
  TestBed.configureTestingModule({
    imports: [MxDbTypesCellRendererComponent],
  }).overrideComponent(MxDbTypesCellRendererComponent, {
    set: {
      imports: [],
      schemas: [NO_ERRORS_SCHEMA],
    },
  });

  return TestBed.createComponent(MxDbTypesCellRendererComponent)
    .componentInstance;
}

describe("MxDbTypesCellRendererComponent", () => {
  it("sets mxDbTypes from row data", () => {
    const component = createComponent();

    component.agInit({
      data: { mxDbTypes: ["financial", "reporting"] },
    } as ICellRendererParams);

    expect(component.mxDbTypes()).toEqual(["financial", "reporting"]);
  });

  it("defaults to empty array when mxDbTypes is absent from data", () => {
    const component = createComponent();

    component.agInit({ data: {} } as ICellRendererParams);

    expect(component.mxDbTypes()).toEqual([]);
  });

  it("defaults to empty array when data is undefined", () => {
    const component = createComponent();

    component.agInit({ data: undefined } as ICellRendererParams);

    expect(component.mxDbTypes()).toEqual([]);
  });

  it("returns false from refresh", () => {
    const component = createComponent();

    expect(component.refresh()).toBe(false);
  });
});
